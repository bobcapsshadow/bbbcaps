import cloudinary from "../config/cloudinary.js";

import User from "../models/User.js";

// ======================================================
// Constants
// ======================================================

const KYC_STATUS = {
    NOT_STARTED: "not_started",
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
};

// ======================================================
// Validators
// ======================================================

const aadhaarRegex = /^[2-9]{1}[0-9]{11}$/;

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// ======================================================
// Validate Aadhaar
// ======================================================

const validateAadhaar = (aadhaarNumber) => {

    if (!aadhaarRegex.test(aadhaarNumber)) {

        throw new Error("Invalid Aadhaar number.");

    }

};

// ======================================================
// Validate PAN
// ======================================================

const validatePan = (panNumber) => {

    const formattedPan = panNumber.toUpperCase();

    if (!panRegex.test(formattedPan)) {

        throw new Error("Invalid PAN number.");

    }

    return formattedPan;

};

// ======================================================
// Validate DOB
// ======================================================

const validateDob = (dob) => {

    const birthDate = new Date(dob);

    if (Number.isNaN(birthDate.getTime())) {

        throw new Error("Invalid date of birth.");

    }

    const today = new Date();

    let age =
        today.getFullYear() -
        birthDate.getFullYear();

    const monthDifference =
        today.getMonth() -
        birthDate.getMonth();

    if (
        monthDifference < 0 ||
        (
            monthDifference === 0 &&
            today.getDate() < birthDate.getDate()
        )
    ) {

        age--;

    }

    if (age < 18) {

        throw new Error(
            "You must be at least 18 years old."
        );

    }

    return birthDate;

};

// ======================================================
// Delete File Safely
// ======================================================
// ======================================================
// Delete Old KYC Images
// ======================================================

const deleteOldKycFiles = async (user) => {

    if (!user?.kyc) return;

    const urls = [

        user.kyc.aadhaarFront,

        user.kyc.aadhaarBack,

        user.kyc.panImage,

    ];

    for (const url of urls) {

        if (!url) continue;

        if (!url.startsWith("https://")) continue;

        try {

            const match = url.match(
                /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/
            );

            if (!match) continue;

            await cloudinary.uploader.destroy(
                match[1]
            );

        } catch (error) {

            console.error(
                "Cloudinary delete failed:",
                error.message
            );

        }

    }

};
// ======================================================
// Submit KYC
// ======================================================

export const submitKyc = async (
    userId,
    body,
    files
) => {

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    // ==========================================
    // Prevent Duplicate Submission
    // ==========================================

    if (
        user.kyc?.status === KYC_STATUS.PENDING
    ) {
        throw new Error(
            "Your KYC verification is already under review."
        );
    }

    if (
        user.kyc?.status === KYC_STATUS.APPROVED
    ) {
        throw new Error(
            "Your KYC has already been approved."
        );
    }

    // ==========================================
    // Request Body
    // ==========================================

    const {
        fullName,
        dob,
        aadhaarNumber,
        panNumber,
    } = body;

    // ==========================================
    // Required Fields
    // ==========================================

    // ==========================================
    // Required Fields
    // ==========================================

    if (!fullName || !dob) {
        throw new Error("Full name and Date of Birth are required.");
    }

    const hasAadhaar =
        aadhaarNumber?.trim();

    const hasPan =
        panNumber?.trim();

    if (!hasAadhaar && !hasPan) {
        throw new Error(
            "Please provide either Aadhaar or PAN details."
        );
    }

    // ==========================================
    // Uploaded Files
    // ==========================================

    const aadhaarFront =
        files?.aadhaarFront?.[0];

    const aadhaarBack =
        files?.aadhaarBack?.[0];

    const panImage =
        files?.panImage?.[0];

    const hasValidAadhaar =
        hasAadhaar &&
        aadhaarFront &&
        aadhaarBack;

    const hasValidPan =
        hasPan &&
        panImage;

    if (!hasValidAadhaar && !hasValidPan) {
        throw new Error(
            "Please complete either Aadhaar or PAN verification."
        );
    }

    // ==========================================
    // Validate User Data
    // ==========================================

    const birthDate =
        validateDob(dob);

    let formattedPan = null;

    if (hasAadhaar) {
        validateAadhaar(aadhaarNumber);
    }

    if (hasPan) {
        formattedPan =
            validatePan(panNumber);
    }

    // ==========================================
    // Delete Old Images (Rejected Users)
    // ==========================================

    if (
        user.kyc?.status ===
        KYC_STATUS.REJECTED
    ) {

        await deleteOldKycFiles(user);

    }

    // ==========================================
    // Save KYC
    // ==========================================

    user.kyc = {

        status: KYC_STATUS.PENDING,

        fullName: fullName.trim(),

        dob: birthDate,

        aadhaarNumber: hasAadhaar
            ? aadhaarNumber.trim()
            : null,

        panNumber: hasPan
            ? formattedPan
            : null,

        aadhaarFront: hasValidAadhaar
            ? aadhaarFront.path
            : null,

        aadhaarBack: hasValidAadhaar
            ? aadhaarBack.path
            : null,

        panImage: hasValidPan
            ? panImage.path
            : null,

        submittedAt: new Date(),

        approvedAt: null,

        rejectedReason: "",

    };

    await user.save();

    return {

        success: true,

        message:
            "KYC submitted successfully.",

        status: user.kyc.status,

    };

};
// ======================================================
// Get Logged-in User KYC
// ======================================================

export const getMyKyc = async (userId) => {

    const user = await User.findById(userId).select("kyc");

    if (!user) {
        throw new Error("User not found.");
    }

    return {
        success: true,
        kyc: user.kyc || {
            status: KYC_STATUS.NOT_STARTED,
        },
    };

};

// ======================================================
// Approve KYC
// ======================================================

export const approveKyc = async (userId) => {

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    if (!user.kyc) {
        throw new Error("KYC not found.");
    }

    if (user.kyc.status !== KYC_STATUS.PENDING) {
        throw new Error(
            "Only pending KYC can be approved."
        );
    }

    user.kyc.status = KYC_STATUS.APPROVED;

    user.kyc.approvedAt = new Date();

    user.kyc.rejectedReason = "";

    await user.save();

    return {

        success: true,

        message: "KYC approved successfully.",

        status: user.kyc.status,

    };

};

// ======================================================
// Reject KYC
// ======================================================

export const rejectKyc = async (
    userId,
    rejectedReason
) => {

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    if (!user.kyc) {
        throw new Error("KYC not found.");
    }

    if (user.kyc.status !== KYC_STATUS.PENDING) {
        throw new Error(
            "Only pending KYC can be rejected."
        );
    }

    user.kyc.status = KYC_STATUS.REJECTED;

    user.kyc.approvedAt = null;

    user.kyc.rejectedReason =
        rejectedReason?.trim() ||
        "Verification failed.";

    await user.save();

    return {

        success: true,

        message: "KYC rejected successfully.",

        status: user.kyc.status,

    };

};
// ======================================================
// Get Pending KYC List
// ======================================================

export const getPendingKycs = async () => {

    const users = await User.find({
        "kyc.status": KYC_STATUS.PENDING,
    })
        .select("-password")
        .sort({
            "kyc.submittedAt": -1,
        });

    return {
        success: true,
        count: users.length,
        users,
    };

};

// ======================================================
// Get Approved KYC List
// ======================================================

export const getApprovedKycs = async () => {

    const users = await User.find({
        "kyc.status": KYC_STATUS.APPROVED,
    })
        .select("-password")
        .sort({
            "kyc.approvedAt": -1,
        });

    return {
        success: true,
        count: users.length,
        users,
    };

};

// ======================================================
// Get Rejected KYC List
// ======================================================

export const getRejectedKycs = async () => {

    const users = await User.find({
        "kyc.status": KYC_STATUS.REJECTED,
    })
        .select("-password")
        .sort({
            "kyc.submittedAt": -1,
        });

    return {
        success: true,
        count: users.length,
        users,
    };

};

// ======================================================
// Export Status Constants
// ======================================================

export { KYC_STATUS };