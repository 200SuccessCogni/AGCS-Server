'use strict';
const excelToJson = require('convert-excel-to-json');
 
const result = excelToJson({
    sourceFile: './Reviews.xlsx'
});

module.exports = {result}