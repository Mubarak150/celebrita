// what is its  purpose?
module.exports = (func) => (req, res, next) =>
  func(req, res, next).catch((err) => next(err));

// the above can also be written as:
// module.exports = (func) => {
//        return (req, res, next) => {
//             func(req, res, next).catch((err) =>{
//                                                 next(err)
//                                             })
//         }
//     }
