import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionResponse = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_Name}`
    );
    console.log("MongoDB connected successfully");

    // console.log(connectionResponse);
  } catch (error) {
    console.log("MongoDB connection error:" + error);
    // throw error; any one can be used either throw the error or exit the process.
    process.exit(1);
  }
};
export default connectDB;
