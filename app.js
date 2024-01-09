const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()

app.use(express.json())

let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDbAndServer()

const convertToTODOobj = eachStatus => {
  return {
    id: eachStatus.id,
    todo: eachStatus.todo,
    priority: eachStatus.priority,
    status: eachStatus.status,
  }
}
const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

//GET todoStatus
app.get('/todos/', async (request, response) => {
  const {priority = '', status = '', search_q = ''} = request.query
  let getQueryToDo = ''
  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getQueryToDo = `
    SELECT
      *
    FROM
      todo 
    WHERE
      todo LIKE '%${search_q}%'
      AND status = '${status}'
      AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getQueryToDo = `
    SELECT
      *
    FROM
      todo 
    WHERE
      todo LIKE '%${search_q}%'
      AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getQueryToDo = `SELECT
      *
    FROM
      todo 
    WHERE
      todo LIKE '%${search_q}%'
      AND status = '${status}';`
      break
    default:
      getQueryToDo = `
    SELECT
      *
    FROM
      todo 
    WHERE
      todo LIKE '%${search_q}%';`
  }

  const statusArray = await db.all(getQueryToDo)
  response.send(statusArray.map(eachStatus => convertToTODOobj(eachStatus)))
})

///GET todo
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const gettodoQuery = `SELECT *
    FROM todo WHERE id=${todoId}`
  const todo = await db.get(gettodoQuery)
  response.send(convertToTODOobj(todo))
})

///CREATE todo
app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status} = todoDetails
  const createtodoQuery = `INSERT INTO todo(id,todo,priority,status)
    VALUES(${id}, "${todo}" , "${priority}" , "${status}");`
  const listTo = await db.run(createtodoQuery)
  response.send('Todo Successfully Added')
})

//UPDATE todo
app.put('/todos/:todoId/', async (request, response) => {
  const todoDetails = request.body
  const {priority, status, todo} = todoDetails
  let updatetodoQuery = ''
  switch (true) {
    case hasPriorityProperty(todoDetails):
      updatetodoQuery = `UPDATE todo SET
      priority="${priority}"
    ;`
      await db.run(updatetodoQuery)
      response.send('Priority Updated')
      break
    case hasStatusProperty(todoDetails):
      updatetodoQuery = `UPDATE todo SET
      status="${status}"
    ;`
      await db.run(updatetodoQuery)
      response.send('Status Updated')
      break

    default:
      updatetodoQuery = `UPDATE todo SET
      todo="${todo}"
    ;`
      await db.run(updatetodoQuery)
      response.send('Todo Updated')
      break
  }
})

//DELETE todo
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deletetodoQuery = `DELETE 
    FROM todo WHERE id=${todoId}`
  await db.get(deletetodoQuery)
  response.send('Todo Deleted')
})
module.exports = app
