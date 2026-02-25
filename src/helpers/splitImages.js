const splitImages = (images) => {
    const imageArray = images.split(',http').map((img, index) => index === 0 ? img : `http${img}`);

    return imageArray
};

module.exports = { splitImages };