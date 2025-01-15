const { Op } = require("sequelize");

class ApiFeatures {
  constructor(model, sub_model = [], queryStr) {
    this.model = model;
    this.sub_model = sub_model;
    // this.attributes = attributes;
    // this.alias = alias;
    this.queryOptions = {};
    this.queryStr = queryStr;
    this.paginationMetadata = {};
  }

  filter() {
    const excludeFields = ["sort", "page", "limit", "fields", "include"];
    const queryObj = { ...this.queryStr };
    excludeFields.forEach((el) => delete queryObj[el]);

    // future dev:::: i am adding the followin' 2 if clauses for price range search... each step is guided.. and you can safely remove it if dont need any filteration for price
    if (queryObj?.quantity?.lte) {
      queryObj.quantity = {
        ...queryObj.quantity, // Retain other existing filters (if any)
        [Op.lte]: queryObj.quantity.lte, // Add lte filter
      };
      delete queryObj.quantity.lte;
    }

    if (queryObj.price) {
      if (queryObj.price.gte) {
        queryObj.price = {
          ...queryObj.price, // Retain other existing filters (if any)
          [Op.gte]: queryObj.price.gte, // Add gte filter
        };
        delete queryObj.price.gte;
      }

      if (queryObj.price.lte) {
        queryObj.price = {
          ...queryObj.price, // Retain other existing filters (if any)
          [Op.lte]: queryObj.price.lte, // Add lte filter
        };
        delete queryObj.price.lte;
      }
    }

    // i am adding this BLOCK for search compatibility... for search pass field say id as id_like and name as name_like ... i you dont want searches... then you can safely remove this block.
    for (const key in queryObj) {
      if (key.endsWith("_like")) {
        const field = key.replace("_like", "");
        queryObj[field] = { [Op.like]: `%${queryObj[key]}%` };
        delete queryObj[key];
      }
      if (key.endsWith("_not")) {
        const field = key.replace("_not", "");
        queryObj[field] = { [Op.notLike]: `%${queryObj[key]}%` };
        delete queryObj[key];
      }
    }

    console.log(queryObj);
    this.queryOptions.where = queryObj;

    return this;
  }

  sort() {
    this.queryOptions.order = this.queryStr.sort
      ? this.queryStr.sort.split(",").map((field) => [field, "ASC"])
      : [["createdAt", "DESC"]];
    return this;
  }

  limit_fields() {
    this.queryOptions.attributes = this.queryStr.fields
      ? this.queryStr.fields.split(",")
      : {
          exclude: [
            "updatedAt",
            "password",
            "otp",
            "otp_expiry",
            "pass_hash",
            "send_emails",
          ],
        };
    return this;
  }

  async paginate() {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 40;
    const offset = (page - 1) * limit;

    this.queryOptions.limit = limit;
    this.queryOptions.offset = offset;

    const totalCount = await this.model.count({
      where: this.queryOptions.where,
    });
    const totalPages = Math.ceil(totalCount / limit);

    this.paginationMetadata = {
      totalCount,
      totalPages,
      currentPage: page,
      showing: `${offset + 1}-${Math.min(
        offset + limit,
        totalCount
      )} of ${totalCount}`,
    };
    return this;
  }

  includes(sub_models) {
    sub_models = sub_models.map(({ model, alias, attributes }) => ({
      model,
      as: alias || undefined, // Include alias only if provided
      attributes: attributes || { exclude: ["createdAt"] }, // Use provided or default attributes
    }));

    this.queryOptions.include = [
      ...(this.queryOptions.include || []), // Preserve existing includes
      ...sub_models, // Add new models
    ];

    return this;
  }
}

module.exports = ApiFeatures;
