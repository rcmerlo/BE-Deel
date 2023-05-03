const express = require('express')
const router = express.Router()
const { getProfile } = require('../middleware/getProfile')
const { Op } = require('sequelize')

/**
 * @returns active contracts by profile
 */
router.get('/', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')

  const contracts = await Contract.findAll({
    where: {
      [Op.or]: [{ ContractorId: req.profile.id }, { ClientId: req.profile.id }],
      status: {
        [Op.ne]: 'terminated',
      },
    },
  })
  if (!contracts) return res.status(404).end()

  res.json(contracts)
})

/**
 * @returns contract by id
 */
router.get('/:id', getProfile, async (req, res) => {
  const { Contract } = req.app.get('models')
  const { id } = req.params

  const contract = await Contract.findOne({
    where: {
      id,
      [Op.or]: [{ ContractorId: req.profile.id }, { ClientId: req.profile.id }],
    },
  })
  if (!contract) return res.status(404).end()

  res.json(contract)
})

module.exports = router
