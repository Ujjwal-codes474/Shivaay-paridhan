const mongoose = require("mongoose");
const Product = require("./models/Product");

mongoose.connect("mongodb://127.0.0.1:27017/shivaay")
  .then(async () => {
    const docs = await Product.find();
    console.log(JSON.stringify(docs, null, 2));
    await mongoose.disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
