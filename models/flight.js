import mongoose from 'mongoose';
const { Schema } = mongoose;
const flightSchema = new Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    airport: { type: String, required: true },
    arrivalairport: { type: String, required: true },
    date: { type: String, required: true }
});
export default mongoose.model("Flight", flightSchema);