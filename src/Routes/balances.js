const express = require('express')
const router = express.Router()
const { getProfile } = require('../middleware/getProfile')
const Sequelize = require('sequelize')

/**
 * Deposit money into client balance
 *
 * @returns Job after been paid
 */
router.post('/deposit/:userId', getProfile, async (req, res) => {
  const { Profile, Job, Contract } = req.app.get('models')
  const sequelize = req.app.get('sequelize')
  const { userId } = req.params
  const { amount } = req.body

  if (req.profile.type !== 'client') return res.status(403).end()

  const user = await Profile.findOne({ where: { id: userId, type: 'client' } })
  if (!user) return res.status(404).end()

  try {
    await sequelize.transaction(async (t) => {
      const result = await Job.findAll(
        {
          where: { paid: { [Sequelize.Op.not]: true } },
          include: [
            {
              model: Contract,
              where: {
                ClientId: req.profile.id,
                status: {
                  [Sequelize.Op.ne]: 'terminated',
                },
              },
              attributes: ['ClientId'],
              include: [
                {
                  model: Profile,
                  as: 'Client',
                  where: {
                    id: req.profile.id,
                  },
                  attributes: ['balance'],
                },
              ],
            },
          ],
          attributes: [[sequelize.fn('sum', sequelize.col('price')), 'totalPrice']],
          group: ['Contract.ClientId'],
          raw: true,
        },
        { transaction: t }
      )

      const { totalPrice, 'Contract.Client.balance': clientBalance } = result.shift() || {
        totalPrice: 0,
        'Contract.Client.balance': req.profile.balance,
      }

      if ((totalPrice > 0 && (amount / totalPrice) * 100 > 25) || clientBalance < amount)
        return res.status(403).end()

      await Profile.update(
        { balance: Sequelize.literal(`balance + ${amount}`) },
        { where: { id: user.id } },
        { transaction: t }
      )

      await Profile.update(
        { balance: Sequelize.literal(`balance - ${amount}`) },
        { where: { id: req.profile.id } },
        { transaction: t }
      )

      const updatedProfile = await Profile.findOne({ where: { id: userId } }, { transaction: t })

      res.json(updatedProfile)
    })
  } catch (error) {
    return res.status(400).end()
  }
})

module.exports = router
