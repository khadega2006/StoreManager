
const getPublicId = (imageUrl) => {
    if (!imageUrl) return null;

    const parts = imageUrl.split("/upload/");
    if (parts.length < 2) return null;

    const publicIdWithVersion = parts[1];
    const publicId = publicIdWithVersion
        .replace(/^v\d+\//, "")
        .replace(/\.[^/.]+$/, "");

    return publicId;
};

export default getPublicId;
