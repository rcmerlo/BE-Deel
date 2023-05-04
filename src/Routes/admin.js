const express = require('express')
const router = express.Router()
const { getProfile } = require('../middleware/getProfile')
const { Op } = require('sequelize')

const subDays = (baseDate, days) => {
  const newDate = new Date()
  newDate.setDate(baseDate.getDate() - days)

  return newDate
}

/**
 *
 * @returns the professional that earned the most money in the query time range
 */
router.get('/best-profession', getProfile, async (req, res) => {
  const { Job, Profile, Contract } = req.app.get('models')
  const sequelize = req.app.get('sequelize')

  const endDate = req.query.end || new Date() // default is now
  const startDate = req.query.start || subDays(endDate, 1) //default is now less 1 day

  const result = (
    await Job.findAll({
      where: { paid: true, paymentDate: { [Op.between]: [startDate, endDate] } },
      include: [
        {
          model: Contract,
          attributes: ['ContractorId'],
          include: [
            {
              model: Profile,
              as: 'Contractor',
            },
          ],
        },
      ],
      attributes: [[sequelize.fn('sum', sequelize.col('price')), 'totalReceived']],
      group: ['Contract.ContractorId'],
      order: [[sequelize.col('totalReceived'), 'DESC']],
    })
  ).shift()

  res.json(result?.Contract?.Contractor || [])
})

/**
 *
 * @returns the professional that earned the most money in the query time range
 */
router.get('/best-clients', getProfile, async (req, res) => {
  const { Job, Profile, Contract } = req.app.get('models')
  const sequelize = req.app.get('sequelize')

  const endDate = req.query.end || new Date() // default is now
  const startDate = req.query.start || subDays(endDate, 1) //default is now less 1 day
  const limit = req.query.limit || 1

  const result = (
    await Job.findAll({
      where: { paid: true, paymentDate: { [Op.between]: [startDate, endDate] } },
      include: [
        {
          model: Contract,
          attributes: ['ClientId'],
          include: [
            {
              model: Profile,
              as: 'Client',
            },
          ],
        },
      ],
      attributes: [[sequelize.fn('sum', sequelize.col('price')), 'paid']],
      group: ['Contract.ClientId'],
      order: [[sequelize.col('paid'), 'DESC']],
      limit,
    })
  ).map((item) => ({
    id: item.Contract.Client.id,
    fullName: `${item.Contract.Client.firstName} ${item.Contract.Client.lastName}`,
    paid: item.paid,
  }))

  res.json(result)
})

module.exports = router
