const ApiFeatures = require("./ApiFeatures");
const asyncErrorHandler = require("./asyncErrorHandler");
const { makeError, CustomError } = require("./CustomError");

/*
 _____________________________________________________________________________________
|                                                                                     |
|                     ******* REQ. SUCCESS MESSAGE *******                            |
|_____________________________________________________________________________________|

*/

const sendSuccess = (
  res,
  status_code,
  message,
  data = null,
  dataKey = "data",
  count = null,
  token = null
) => {
  const response = { status: true, message: message };
  if (token) response["token"] = token;
  if (count !== null && count !== undefined) response["count"] = count;
  if (data) response[dataKey] = data;
  return res.status(status_code).json(response);
};

/*
 _____________________________________________________________________________________
|                                                                                     |
|                           ******* PARSER *******                                    |
|_____________________________________________________________________________________|

*/

// 2.1. to parse a stringified array:
const parse = (input) => {
  const parsefn = (input) => {
    if (input.images) {
      // Convert the double stringified images array to a proper array .. .i yet dont know what is causing the double stringificaiton but for now this is the solution.
      input.images = JSON.parse(input.images);
      // input.images = JSON.parse(input.images);
    }
    return input;
  };

  // actual game is here:
  if (Array.isArray(input)) return input.map((item) => parsefn(item));
  if (typeof input == "object") parsefn(input);

  return input;
};

/*
 _____________________________________________________________________________________
|                                                                                     |
|                         ******* CRUD HELPERS *******                                |
|_____________________________________________________________________________________|


 _____________________________________________________________________________________
|                                                                                     |
|                           ******* I. CREATE *******                                 |
|_____________________________________________________________________________________|

*/

const create = (model) =>
  asyncErrorHandler(async (req, res, next) => {
    const transaction = await model.sequelize.transaction();
    console.dir(req.body);
    try {
      // let data = processImages(req);
      let newRecord;
      // if(request.body.plot) {
      //     newRecord = await model.create(request.body.plot, { transaction });

      //     if (request.body.plot_sales && Array.isArray(request.body.plot_sales)) {
      //         const plotSaleHistoryData = request.body.plot_sales.map(sale => ({
      //           ...sale,
      //           plot_alloted: request.body.plot.plot_alloted
      //         }));

      //         await PlotSaleHistory.bulkCreate(plotSaleHistoryData, { transaction });
      //       }

      // } else {
      newRecord = await model.create(req.body, { transaction });
      // }

      await transaction.commit();

      sendSuccess(res, 200, `record created successfully`);
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  });

/*
 _____________________________________________________________________________________
|                                                                                     |
|                          ******* II. READ ALL *******                               |
|_____________________________________________________________________________________|

*/

const getAll = async (req, res, model, { sub_model, alias }, attributes) => {
  const features = new ApiFeatures(model, { sub_model, alias }, req.query)
    .filter()
    .sort()
    .limit_fields();
  (await features.paginate()).includes(sub_model, alias, attributes);

  let results = await model.findAll(features.queryOptions);

  if (results.length == 0 || !results)
    sendSuccess(res, 200, "no matching data found");
  else {
    results = await parse(results);
    sendSuccess(res, 200, "data retrieved", {
      results: results,
      metadata: features.paginationMetadata,
    });
  }
};

/*
 _____________________________________________________________________________________
|                                                                                     |
|                          ******* III. READ ONE *******                              |
|_____________________________________________________________________________________|

*/

const getOne = async (req, res, model, { sub_model, alias }, attributes) => {
  const features = new ApiFeatures(model, { sub_model, alias }, req.params)
    .filter()
    .sort()
    .limit_fields()
    .includes(sub_model, alias, attributes);
  let results = await model.findOne(features.queryOptions);

  if (!results) sendSuccess(res, 200, "no matching data found");
  else {
    results = parse(results);
    sendSuccess(res, 200, "data retrieved", { results });
  }
};

/*
 _____________________________________________________________________________________
|                                                                                     |
|                           ******* IV. UPDATE *******                                |
|_____________________________________________________________________________________|

*/

const update = (model) =>
  asyncErrorHandler(async (req, res, next) => {
    const transaction = await model.sequelize.transaction();
    try {
      const existingRecord = await model.findOne({
        where: { id: req.params.id },
        transaction,
      });

      if (!existingRecord) {
        await transaction.rollback();
        return makeError(`record with this ID not found!`, 404, next);
      }

      const [updated] = await model.update(req.body, {
        where: { id: req.params.id },
        individualHooks: true,
        transaction,
      });

      if (!updated) {
        await transaction.rollback();
        return makeError(`No updates made to record`, 400, next);
      }

      await transaction.commit();
      sendSuccess(res, 200, `record updated successfully`);
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      next(error);
    }
  });

// 4. delete:

module.exports = { sendSuccess, create, getAll, getOne, update };
