const express = require("express");
const db = require('../db');
const router = new express.Router();
const ExpressError = require("../expressError");

/** GET /invoices: get list of invoices */
router.get("/", async function (req, res) {

  const result = await db.query(
    `SELECT id, comp_code FROM invoices`
  );

  return res.json({ invoices: result.rows });
});

/** GET /invoices/[id]: get single invoice by invoice id */
router.get("/:id", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description
      FROM invoices AS i
      JOIN
        companies AS c
      ON i.comp_code = c.code
      WHERE i.id=$1`, [req.params.id]
    );

    let { id, amt, paid, add_date, paid_date, ...company } = result.rows[0];
    // let company = { code, name, description };
    let invoice = { id, amt, paid, add_date, paid_date, company };
    
    if (result.rows[0]) {
      return res.json({ invoice });
    }
    throw new ExpressError("Invoice not in database. Try again!", 404)
  } 
  catch (err) {
    next(err);
  }
});


/** POST /invoices: post single invoice */
router.post("/", async function (req, res, next) {
  try {
    const { comp_code, amt } = req.body;

    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]
    );

    return res.status(201).json({ invoice: result.rows[0] });
  } 
  catch (err) {
    next(err);
  }
});

/** PATCH /invoices/[id]: partially update an existing invoice by invoice id */
router.patch("/:id", async function (req, res, next) {
  try {
    const { amt, paid } = req.body;
    let result;
    let paid_date;

    paidResult = await db.query(
      `SELECT paid FROM invoices
        WHERE id=$1`, [req.params.id]
    );

    if (!paidResult.rows[0]) {
      throw new ExpressError("Invoice not in database. Try again!", 404)
    }

    prevPaid = paidResult.rows[0].paid;

    if (paid === prevPaid || paid === undefined){
      result = await db.query(
        `UPDATE invoices SET amt=$2
        WHERE id=$1
        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [req.params.id, amt]
      );
    } else {
      if (paid){
        paid_date = new Date();
      } else {
        paid_date = null;
      }
      result = await db.query(
        `UPDATE invoices SET amt=$2, paid=$3, paid_date=$4
        WHERE id=$1
        RETURNING id, comp_code, amt, paid, add_date, paid_date`, [req.params.id, amt, paid, paid_date]
      );
    }
    
    return res.json({ invoice: result.rows[0] });
  }
  catch (err) {
    next(err);
  }
});


/** DELETE /invoices/[id]: delete an existing invoice by invoice id */
router.delete("/:id", async function (req, res, next) {
  try {
    const result = await db.query(
      `DELETE FROM invoices
      WHERE id = $1`, [req.params.id]
    );

    if (result.rowCount === 1) {
      return res.json({ status: "deleted" });
    }
    throw new ExpressError("Invoice not in database. Try again!", 404);
  }
  catch (err) {
    next(err);
  }
});


module.exports = router;