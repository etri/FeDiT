const Model = require("../../models");
const model = new Model();
const ErrorHandler = require("../../lib/error-handler");
const lib = require("../../lib/index");
const config = require("../../config");
class Identifier {
   // 고유번호 증가 로직
   async getNextSerialNumber({ identifierType }) {
      // 고유번호 조회
      const result = await model.postgres.selectRawData({
         sql: `SELECT current_serial FROM identifiers WHERE identifier_type = '${identifierType}' FOR UPDATE;`,
      });

      let serialNumber = 0;
      let nextSerialNumber;

      if (result?.rows && result.rows.length > 0) {
         serialNumber = result.rows[0].current_serial;
         // 다음 고유번호로 증가시키기
         nextSerialNumber = serialNumber + 1;
      } else {
         nextSerialNumber = serialNumber + 1;
      }
      // 고유번호 업데이트 또는 삽입
      await model.postgres.sendQuery({
         sql: `INSERT INTO identifiers (identifier_type, current_serial) VALUES ('${identifierType}', ${nextSerialNumber}) 
      ON CONFLICT (identifier_type) DO UPDATE SET current_serial = ${nextSerialNumber};`,
      });

      return nextSerialNumber;
   }

   // 디지털 트윈 식별자 분류체계 종류 조회 API
   async getClassificationSchemeDescription({ code }) {
      let result;
      if (code) {
         result = await model.postgres.selectRawData({
            sql: `SELECT * FROM twin_classification_types WHERE code_number = '${code}';`,
         });
         if (result?.rows && result.rows.length > 0) {
            return result.rows[0];
         } else {
            throw new ErrorHandler(
               412,
               412,
               "해당 분류체계를 찾을 수 없습니다"
            );
         }
      } else {
         result = await model.postgres.selectRawData({
            sql: `SELECT * FROM twin_classification_types;`,
         });
         return result.rows;
      }
   }

   // 표준산업분류체계 대분류 코드 조회 API
   async getIndustryClassificationDescription({ code }) {
      let result;

      const tableMapping = {
         C: "twin_standard_industry_categorie_c",
      };

      // code가 존재하고 해당하는 테이블이 있을 때
      if (code && tableMapping[code]) {
         const tableName = tableMapping[code];

         result = await model.postgres.selectRawData({
            sql: `SELECT * FROM ${tableName};`,
         });

         if (result?.rows && result.rows.length > 0) {
            return result.rows;
         } else {
            throw new ErrorHandler(
               412,
               412,
               "해당 표준산업분류체계를 찾을 수 없습니다"
            );
         }
      } else if (code && !tableMapping[code]) {
         // code가 존재하지만 기본 테이블에 없을 때
         throw new ErrorHandler(
            412,
            412,
            "해당 표준산업분류체계를 분류코드를 찾을 수 없습니다"
         );
      } else {
         // code가 없을 때 기본 테이블에서 조회
         result = await model.postgres.selectRawData({
            sql: `SELECT * FROM twin_standard_industry_major_categories;`,
         });
         return result.rows;
      }
   }

   // 공공자원분류체계 대분류 코드 조회 API
   async getPublicResourceClassificationDescription({ code }) {
      let result;

      const tableMapping = {
         C: "twin_public_resource_categorie_c",
         K: "twin_public_resource_categorie_k",
         N: "twin_public_resource_categorie_n",
      };

      // code가 존재하고 해당하는 테이블이 있을 때
      if (code && tableMapping[code]) {
         const tableName = tableMapping[code];

         result = await model.postgres.selectRawData({
            sql: `SELECT * FROM ${tableName};`,
         });

         if (result?.rows && result.rows.length > 0) {
            return result.rows;
         } else {
            throw new ErrorHandler(
               412,
               412,
               "해당 공공자원분류체계를 찾을 수 없습니다"
            );
         }
      } else if (code && !tableMapping[code]) {
         // code가 존재하지만 기본 테이블에 없을 때
         throw new ErrorHandler(
            412,
            412,
            "해당 공공자원분류체계의 분류코드를 찾을 수 없습니다"
         );
      } else {
         // code가 없을 때 기본 테이블에서 조회
         result = await model.postgres.selectRawData({
            sql: `SELECT * FROM twin_public_resource_major_categories;`,
         });
         return result.rows;
      }
   }

   // 디지털 트윈 객체 분류체계 설명 조회 API
   async getObjectClassificationDescription({ majorCode, subCode }) {
      let table = "";
      if (majorCode === "1") {
         table = "object_classification_product";
      } else if (majorCode === "2") {
         table = "object_classification_facility";
      } else {
         throw new ErrorHandler(412, 412, "유효하지 않은 majorCode입니다.");
      }

      const result = await model.postgres.selectRawData({
         sql: `SELECT * FROM ${table} WHERE code_number = '${subCode}'`,
      });
      if (result?.rows && result.rows.length > 0) {
         return result.rows[0];
      } else {
         throw new ErrorHandler(
            412,
            412,
            "해당 객체 분류체계를 찾을 수 없습니다"
         );
      }
   }
}

module.exports = Identifier;
