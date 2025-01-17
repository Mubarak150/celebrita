const express = require("express");
const router = express.Router();
const {
  //   getOrders,
  getOrders,
  updateOrder,
  getOrderById,
  dynamicSchemaMiddleware,
} = require("../../controllers/cartAndOrder/orderController");

const { auth, allow, validate } = require("../../middleware/auth");
const uploadImages = require("../../middleware/uploadImage(s)");

// get:
router.get("/", auth, getOrders); //                                                   ?status=:status ... ?status_not=return .... ?status_like=return
router.get("/:id", auth, getOrderById); //
router.patch(
  "/:id/status/:status",
  auth,

  dynamicSchemaMiddleware,

  (req, res, next) => validate(req.selectedSchema)(req, res, next),
  uploadImages,
  updateOrder
);

/*
    ***************************************************************
    *** DEAR FRONTEND DEV: FOLLOW THESE `NOTES` WHILE TACKELING ***         #        STATUS                                      BODY                            TYPE
    *************** THE UPDATED IN ORDERS *************************         1.       approve                                     exp_delivery_date               date i.e. 2024-01-09
    ***************** >>>>>>>>>>>>>>>>>> **************************
    ***************************************************************         2.       reject                                      rejection_reason                string

                            pending (user)                                  3.       on-the-way                                  courier_company                 string
                     __________|____________                                                                                     tracking_id                     string
                    |                       |                               
                 accept                   reject                            4.       received                                    null. 
                    |                                                        
                on-the-way                                                   returns:
                    |                                                        5. THE USER MAY SET THE RETURN TO RETURN-PENDING: `/api/v2/orders/:id/apply-for-return`
                 received                                                         
          __________|________________                                        6.      return-approve                               return_address                string
         |                           |
    completed (auto)       return-pending( by user)                          7.      return-reject                                return_rejection_reason       string
                           __________|________________
                          |                           |                      8. THE USER WILL SET THE ORDER ON THE WAY: `/api/v2/orders/:id/dispatch-return`
                    return-approve              return-reject
                          |                                                  9.      return-receive                               null.   
                    return-on-the-way
                     ( set by user )                                        10.      return-payment                               retrn payment proof           image
                          |
                      return-receive
                          |
                    return_payment

                                                                                                               
*/
module.exports = router;
/*






















*/
// router.patch("/:id/status/:status", auth, updateOrder);

// updates:
// router.put("/pending/:id/:status", protect, isUserAdmin, updateOrderStatus); // status = approve || status = reject // done

// // Approved Orders
// router.get("/approved", protect, isUserAdmin, (req, res) =>
//   getOrdersByStatus(req, res, "approved")
// ); // done
// router.put("/approved/:id/:status", protect, isUserAdmin, updateOrderStatus); // status = on-the-way // done

// router.get("/rejected", protect, isUserAdmin, (req, res) =>
//   getOrdersByStatus(req, res, "rejected")
// ); // done

// // On the Way Orders
// router.get("/on-the-way", protect, isUserAdmin, (req, res) =>
//   getOrdersByStatus(req, res, "on-the-way")
// ); // done
// router.put("/on-the-way/:id/:status", protect, isUserAdmin, updateOrderStatus); // status: recieve

// // Received Orders
// router.get("/received", protect, isUserAdmin, (req, res) =>
//   getOrdersByStatus(req, res, "received")
// ); // done

// // RETURN ORDERS: pending
// router.get("/return-pending", protect, isUserAdmin, (req, res) =>
//   getOrdersByStatus(req, res, "return-pending")
// ); //
// router.put(
//   "/return-pending/:id/:status",
//   protect,
//   isUserAdmin,
//   updateOrderStatus
// ); // status = return-approve || status = return-reject
// // return-rejected dont have routes... as return once rejected is sent to completed orders categoty/status.

// // : approved
// router.get("/return-approved", protect, isUserAdmin, (req, res) =>
//   getOrdersByStatus(req, res, "return-approved")
// ); //

// // : on-the-way
// router.get("/return-on-the-way", protect, isUserAdmin, (req, res) =>
//   getOrdersByStatus(req, res, "return-on-the-way")
// ); //
// router.put(
//   "/return-on-the-way/:id/:status",
//   protect,
//   isUserAdmin,
//   updateOrderStatus
// ); // status = return-received

// // : received
// router.get("/return-received", protect, isUserAdmin, (req, res) =>
//   getOrdersByStatus(req, res, "return-received")
// ); //

// // : return paid
// router.put(
//   "/return-received/:id/:status",
//   protect,
//   isUserAdmin,
//   uploadImages,
//   updateOrderStatus
// ); // status = return-payment

// // Completed Orders
// router.get("/completed", protect, isUserAdmin, (req, res) =>
//   getOrdersByStatus(req, res, "completed")
// ); //
