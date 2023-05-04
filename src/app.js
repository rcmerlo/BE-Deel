const express = require('express')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')

const app = express()
app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

const contracts = require('./Routes/contracts')
const jobs = require('./Routes/jobs')
const balances = require('./Routes/balances')
const admin = require('./Routes/admin')

app.use('/contracts', contracts)
app.use('/jobs', jobs)
app.use('/balances', balances)
app.use('/admin', admin)

module.exports = app
