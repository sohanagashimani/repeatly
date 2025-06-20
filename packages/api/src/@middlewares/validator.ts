// eslint-disable-next-line max-params
export default (schema: any) => async (req: any, res: any, next: any) => {
  try {
    await schema.validate({
      body: req.body,
      file: req.file,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};
