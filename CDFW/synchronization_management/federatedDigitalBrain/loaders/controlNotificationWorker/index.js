/**
 * controlNotificationWorker loader
 * - TIMEOUT 상태 확정
 * - control notification outbox worker를 서버 시작 시 주기 실행
 */

const services = require("../../services");

let notificationWorkerIntervalId = null;
let timeoutCheckerIntervalId = null;

exports.init = () => {
  if (notificationWorkerIntervalId || timeoutCheckerIntervalId) {
    logger.warn(
      "[controlNotificationWorker-load] control notification worker already started",
    );
    return;
  }

  /**
   * PENDING/SENT 제어 결과 중 timeout 대상 확정 + outbox 적재
   */
  timeoutCheckerIntervalId = setInterval(async () => {
    try {
      const results =
        await services.federatedDigitalObjects.markTimeoutControlResults();

      if (results.length > 0) {
        logger.info(
          `[controlNotificationWorker-load] timeout control results: ${JSON.stringify(
            results,
          )}`,
        );
      }
    } catch (error) {
      logger.error(
        `[controlNotificationWorker-load] timeout checker error: ${
          error?.message || String(error)
        }`,
      );
    }
  }, 5000);

  /**
   * outbox에 적재된 PENDING 알림 webhook 발송
   */
  notificationWorkerIntervalId = setInterval(async () => {
    try {
      const results =
        await services.controlNotificationWorker.runControlNotificationWorker();

      if (results.length > 0) {
        logger.info(
          `[controlNotificationWorker-load] control notification worker results: ${JSON.stringify(
            results,
          )}`,
        );
      }
    } catch (error) {
      logger.error(
        `[controlNotificationWorker-load] control notification worker error: ${
          error?.message || String(error)
        }`,
      );
    }
  }, 5000);

  logger.info(
    "[controlNotificationWorker-load] control notification worker initialized",
  );
};
