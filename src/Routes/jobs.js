const express = require('express')
const router = express.Router()
const { getProfile } = require('../middleware/getProfile')
const Sequelize = require('sequelize')

/**
 * @returns all unpaid jobs for a user for active contracts
 */
router.get('/unpaid', getProfile, async (req, res) => {
  const { Job, Contract } = req.app.get('models')

  const jobs = await Job.findAll({
    where: { paid: { [Sequelize.Op.not]: true } },
    include: [
      {
        model: Contract,
        where: {
          [Sequelize.Op.or]: [{ ContractorId: req.profile.id }, { ClientId: req.profile.id }],
          status: {
            [Sequelize.Op.ne]: 'terminated',
          },
        },
      },
    ],
  })
  if (!jobs) return res.status(404).end()

  res.json(jobs)
})

/**
 * Client Pay for a job
 *
 * @returns Job after been paid
 */
router.post('/:job_id/pay', getProfile, async (req, res) => {
  const { Job, Profile, Contract } = req.app.get('models')
  const { job_id } = req.params
  const sequelize = req.app.get('sequelize')

  if (req.profile.type !== 'client') return res.status(403).end()

  try {
    await sequelize.transaction(async (t) => {
      const job = await Job.findOne(
        {
          where: { id: job_id, paid: { [Sequelize.Op.not]: true } },
          include: [
            {
              model: Contract,
              where: {
                ClientId: req.profile.id,
              },
            },
          ],
        },
        { transaction: t }
      )
      if (!job) return res.status(404).end()

      if (job.price > req.profile.balance)
        return res.status(403).send('Client balance is not enough')

      await Profile.update(
        { balance: Sequelize.literal(`balance + ${job.price}`) },
        { where: { id: job.Contract.ContractorId } },
        { transaction: t }
      )
      await Profile.update(
        { balance: Sequelize.literal(`balance - ${job.price}`) },
        { where: { id: job.Contract.ClientId } },
        { transaction: t }
      )
      await Job.update(
        { paid: true, paymentDate: new Date() },
        { where: { id: job_id }, returning: true },
        { transaction: t }
      )

      const updatedJob = await Job.findOne(
        {
          where: { id: job_id },
        },
        { transaction: t }
      )

      res.json(updatedJob)
    })
  } catch (error) {
    return res.status(400).end()
  }
})

module.exports = router
