process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("./app")
const db = require('./db');

let testCompany;
let testInvoice;

beforeEach(async function() {
  let resultCompany = await db.query(
    `INSERT INTO companies (code, name, description)
      VALUES ('apple', 'Apple', 'slick wealthy comp')
      RETURNING code, name, description;`
  )
  let resultInvoice = await db.query(
    `INSERT INTO invoices (comp_code, amt)
      VALUES ('apple', 1500)
      RETURNING id, comp_code, amt, paid, add_date, paid_date;`
  )
  testInvoice = resultInvoice.rows[0];
  testCompany = resultCompany.rows[0];
  // console.log("testCompany:", testCompanyWithInvoices)
  // console.log({testInvoice});
})

afterEach(async function() {
  await db.query(`DELETE FROM companies;`); //this should delete its invoices too
})

afterAll(async function() {
  await db.end();
})

describe("GET /companies", function() {
  test("Gets a list companies", async function() {
    const resp = await request(app).get(`/companies`);
    delete testCompany.description;
    delete testCompany.invoices;
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      companies: [testCompany]
    })
  })
})

describe("GET /companies/:code", function() {
  test("Gets a single company", async function() {
    const resp = await request(app).get(`/companies/${testCompany.code}`);
    testCompany = { ...testCompany, invoices: [{...testInvoice, add_date: expect.any(String)}]};

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: testCompany
    })
  })

  test("Get a 404 response", async function() {
    const resp = await request(app).get(`/companies/0`);
    expect(resp.statusCode).toEqual(404);
  })
})

//expectAny