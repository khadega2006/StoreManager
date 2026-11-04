import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export const ROLES = {
    USER: "user",
    ADMIN: "admin"
};

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER
    },
    phone: {
        type: String,
        default: ""
    },

    address: {
        governorate: { type: String, default: "" },
        city: { type: String, default: "" },
        street: { type: String, default: "" }
    }
}, {
    timestamps: true
});

// Hash the password before saving (only when it was changed)
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

// The shape of the user that is sent to the frontend (never includes the password)
userSchema.methods.toSafeObject = function () {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        phone: this.phone || "",
        address: {
            governorate: this.address?.governorate || "",
            city: this.address?.city || "",
            street: this.address?.street || ""
        }
    };
};

const User = mongoose.model("User", userSchema);

export default User;
