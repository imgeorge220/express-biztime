const express = require("express");
const db = require('../db');
const router = new express.Router();
const ExpressError = require("../expressError");


/** GET /companies: get list of companies */
router.get("/", async function (req, res) {

  const result = await db.query(
    `SELECT code, name FROM companies`
  );

  return res.json({ companies: result.rows });
});

/** GET /companies/[code]: get single company by company code */
router.get("/:code", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT code, name, description FROM companies
      WHERE code=$1`, [req.params.code]
    );
    if (result.rows[0]) {
      return res.json({ company: result.rows[0] });
    }
    throw new ExpressError("Company not in database. Try again!", 404)
  }
  catch (err) {
    next(err);
  }
});

/** POST /companies: add a new company */
router.post("/", async function (req, res, next) {
  try {
    const { code, name, description } = req.body;

    const result = await db.query(
      `INSERT INTO companies (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description`, [code, name, description]
    );

    return res.status(201).json({ company: result.rows[0] });
  }
  catch (err) {
    ourErr = new ExpressError("Not a valid submission", 400);
    next(ourErr);
  }
});

/** PUT /companies/[code]: fully update an existing company by company code */
router.put("/:code", async function (req, res, next) {
  try {
    const { name, description } = req.body;

    const result = await db.query(
      `UPDATE companies SET name=$2, description=$3
      WHERE code = $1
      RETURNING code, name, description`, [req.params.code, name, description]
    );

    if (result.rows[0]) {
      return res.json({ company: result.rows[0] });
    }
    throw new ExpressError("Company not in database. Try again!", 404)
  }
  catch (err) {
    next(err);
  }
});

/** DELETE /companies[code]: delete an existing company by company code */
router.delete("/:code", async function (req, res, next) {
  try {
    const result = await db.query(
      `DELETE FROM companies
      WHERE code = $1`, [req.params.code]
    );

    if (result.rowCount === 1) {
      return res.json({ status: "deleted" });
    }
    throw new ExpressError("Company not in database. Try again!", 404)
  }
  catch (err) {
    next(err);
  }
});


module.exports = router;