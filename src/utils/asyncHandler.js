// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//       return await fn(req, res, next);
//     } catch (err) {
//       console.log("ERROR at asynchandler", err);
//       res.status(err.code || 500).json({
//         success: false,
//         message: err.message,
//       });
//     }
//   };

const asyncHandler = (requestHandler) => {
  return async (req, res, next) => {
   return Promise.resolve(  requestHandler(req, res, next)).catch((err) => {
    next(err)});
  };
};

export { asyncHandler };
