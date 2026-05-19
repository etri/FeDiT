const express = require("express");
const asyncify = require("express-asyncify");
const router = asyncify(express.Router());
const services = require("../../../../services");
const ErrorHandler = require("../../../../lib/error-handler");
const auth = require("../../../../middlewares/auth");
const joi = require("../../../../middlewares/joi");

// 디지털 트윈 식별자 생성 API
router.get("/digital-twin-identifiers", async (req, res) => {
   const { countryCode, classificationType, classificationCode } = req.query;
   const currentYear = new Date().getFullYear();

   try {
      // 고유번호 조회 및 생성
      const serialNumber = await services.identifier.getNextSerialNumber({
         identifierType: `${countryCode}-${classificationType}-${classificationCode}`,
      });
      const identifier = `${countryCode}-${classificationType}-${classificationCode}-${currentYear}${String(
         serialNumber
      ).padStart(4, "0")}`;

      res.success(201, identifier);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `디지털 트윈 식별자 생성 실패: ${e}`);
   }
});

// 디지털 트윈 객체 식별자 생성 API
router.get("/digital-twin-object-identifiers", async (req, res) => {
   const { countryCode, majorClassification, subClassification } = req.query;

   try {
      // 고유번호 조회 및 생성
      const serialNumber = await services.identifier.getNextSerialNumber({
         identifierType: `${countryCode}-${majorClassification}${subClassification}`,
      });
      const identifier = `${countryCode}-${majorClassification}${subClassification}-${String(
         serialNumber
      ).padStart(4, "0")}`;

      res.success(201, identifier);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `디지털 트윈 객체 식별자 생성 실패: ${e}`);
   }
});

/**
 * 디지털 트윈 식별자 분류체계 종류 조회 API
 * code가 없으면 기본 테이블(twin_classification_types)에서 조회하여 모든 코드 종류를 return
 */
router.get("/classification-schemes", async (req, res) => {
   try {
      const { code } = req.query;
      const result =
         await services.identifier.getClassificationSchemeDescription({ code });

      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `분류체계 설명 조회 실패: ${e}`);
   }
});

/**
 * 표준산업분류체계 대분류 코드 조회 API
 * ?code=A~P
 * code가 없으면 기본 테이블(twin_standard_industry_major_categories)에서 조회하여 모든 코드 종류를 return
 * code가 존재하고 해당하는 분류코드 테이블이 있을 때 분류코드를 return
 * code가 존재하지만 해당하는 분류코드테이블이 없으면 err return
 */
router.get("/industry-classifications", async (req, res) => {
   try {
      const { code } = req.query;
      const result =
         await services.identifier.getIndustryClassificationDescription({
            code,
         });
      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `표준산업분류체계 설명 조회 실패: ${e}`);
   }
});

/**
 * 공공자원분류체계 대분류 코드 조회 API
 * ?code=A~P
 * code가 없으면 기본 테이블(twin_public_resource_major_categories)에서 조회하여 모든 코드 종류를 return
 * code가 존재하고 해당하는 분류코드 테이블이 있을 때 분류코드를 return
 * code가 존재하지만 해당하는 분류코드테이블이 없으면 err return
 */
router.get("/public-resource-classifications", async (req, res) => {
   try {
      const { code } = req.query;
      const result =
         await services.identifier.getPublicResourceClassificationDescription({
            code,
         });
      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `공공자원분류체계 설명 조회 실패: ${e}`);
   }
});

/**
 * 디지털 트윈 객체 분류체계 설명 조회 API
 * ?majorCode=1&subCode=01010
 */
router.get("/object-classifications", async (req, res) => {
   try {
      const { majorCode, subCode } = req.query;
      const result =
         await services.identifier.getObjectClassificationDescription({
            majorCode,
            subCode,
         });
      res.success(201, result);
   } catch (e) {
      if (!(e instanceof ErrorHandler)) {
         logger.error(e);
         e = new ErrorHandler(500, 500, "Internal Server Error");
      }
      e.handle(req, res, `객체 분류체계 설명 조회 실패: ${e}`);
   }
});

module.exports = router;
