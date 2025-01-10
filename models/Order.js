const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoice_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    total_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    amount_with_delivery: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "approved",
        "on-the-way",
        "received",
        "return-pending",
        "return-approved",
        "return-on-the-way",
        "return-received",
        "completed",
        "rejected"
      ), // specific values
      defaultValue: "pending", // set a default value
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shipping_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_contact: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    exp_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    courier_company: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tracking_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payment_type: {
      type: DataTypes.ENUM("payFast", "COD"),
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.ENUM("pending", "paid", "returned"),
      defaultValue: "pending",
    },
    transaction_id: {
      // added this one on 28/09/2024
      type: DataTypes.STRING,
      allowNull: true,
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    return_proof_image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    return_reason: {
      //return_rejection_reason, return_address
      type: DataTypes.STRING,
      allowNull: true,
    },
    return_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    return_rejection_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    return_company: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    return_tracking_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    return_user_account: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    return_user_account_title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    return_user_account_bank: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    return_payment_proof: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    return_payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  }
);

module.exports = Order;
