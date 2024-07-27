const fs = require('fs');

exports.getProductsFromFile = (filePath, callback) => {
    fs.readFile(filePath, (err, fileContent) => {
        if (err) {
             callback([]);
        }

        if (fileContent.length === 0) {
             callback([]);
        }else{
            try {
                callback(JSON.parse(fileContent));
            } catch (parseError) {
                console.log(parseError);
            }
        }
        
    });
}

