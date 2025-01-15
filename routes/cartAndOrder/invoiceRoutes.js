const express = require("express");
const router = express.Router();
const {
  //   getInvoice,
  getAllInvoices,
  getInvoicesOfUser,
  getInvoiceById,
} = require("../../controllers/cartAndOrder/invoiceController");
const { auth, isUserAdmin } = require("../../middleware/auth");

// order Routes
router.get("/order/:id", auth, getInvoiceById); // get each invoice by its order id
router.get("/admin", auth, getAllInvoices); // get all invoices. for admins and users.. admin see all invoices.. users see only theirs.
router.get("/user", auth, getInvoicesOfUser);
module.exports = router;
