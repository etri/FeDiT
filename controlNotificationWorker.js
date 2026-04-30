/**
 * - control_notification_outbox에 적재된 PENDING 알림을 조회
 * - 구독 대상(control_notification_subscriptions)을 찾아 webhook 발송
 * - 성공 시 SENT, 실패 시 retry 또는 FAILED 처리
 */

const Model = require("../../models");
const model = new Model();

const DEFAULT_WEBHOOK_TIMEOUT_MS = 5000;
const MAX_SEND_ATTEMPT_COUNT = 5;

class ControlNotificationWorker {
  esc(value) {
    return String(value ?? "").replace(/'/g, "''");
  }

  async fetchPendingNotifications(limit = 20) {
    const sql = `
        SELECT *
        FROM control_notification_outbox
        WHERE send_status = 'PENDING'
        AND send_attempt_count < ${MAX_SEND_ATTEMPT_COUNT}
        ORDER BY created_at ASC
        LIMIT ${parseInt(limit)};
    `;

    return await model.postgres.selectDataS({ sql });
  }

  async fetchMatchingSubscriptions(notification) {
    const sql = `
        SELECT *
        FROM control_notification_subscriptions
        WHERE federated_digital_object_id = '${this.esc(
          notification.federated_digital_object_id,
        )}'
        AND event_type = '${this.esc(notification.event_type)}'
        AND is_enabled = TRUE
        AND (
            digital_object_id IS NULL
            OR digital_object_id = '${this.esc(notification.digital_object_id)}'
        )
        ORDER BY subscription_id ASC;
    `;

    return await model.postgres.selectDataS({ sql });
  }

  async markSent(notificationId) {
    const sql = `
        UPDATE control_notification_outbox
        SET send_status = 'SENT',
            sent_at = NOW(),
            send_attempt_count = send_attempt_count + 1,
            last_error = NULL
        WHERE notification_id = ${parseInt(notificationId)};
    `;

    await model.postgres.sendQuery({ sql });
  }

  async markFailedOrRetry(notificationId, errorMessage) {
    const sql = `
        UPDATE control_notification_outbox
        SET send_attempt_count = send_attempt_count + 1,
            send_status = CASE
            WHEN send_attempt_count + 1 >= ${MAX_SEND_ATTEMPT_COUNT}
                THEN 'FAILED'
            ELSE 'PENDING'
            END,
            last_error = '${this.esc(errorMessage)}'
        WHERE notification_id = ${parseInt(notificationId)};
    `;

    await model.postgres.sendQuery({ sql });
  }

  async sendWebhook(subscription, notification) {
    const payload = {
      notification_id: notification.notification_id,
      event_key: notification.event_key,
      event_type: notification.event_type,
      federated_digital_object_id: notification.federated_digital_object_id,
      federated_digital_object_control_data_id:
        notification.federated_digital_object_control_data_id,
      digital_object_id: notification.digital_object_id,
      payload: notification.payload,
      created_at: notification.created_at,
    };

    return await axios.post(subscription.target_endpoint, payload, {
      timeout: DEFAULT_WEBHOOK_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async processNotification(notification) {
    try {
      const subscriptions = await this.fetchMatchingSubscriptions(notification);

      if (!subscriptions || subscriptions.length === 0) {
        await this.markSent(notification.notification_id);
        return {
          notification_id: notification.notification_id,
          result: "NO_SUBSCRIPTION_SKIP",
        };
      }

      for (const subscription of subscriptions) {
        if (subscription.target_type !== "WEBHOOK") {
          throw new Error(
            `Unsupported target_type: ${subscription.target_type}`,
          );
        }

        await this.sendWebhook(subscription, notification);
      }

      await this.markSent(notification.notification_id);

      return {
        notification_id: notification.notification_id,
        result: "SENT",
      };
    } catch (error) {
      await this.markFailedOrRetry(
        notification.notification_id,
        error?.message || String(error),
      );

      return {
        notification_id: notification.notification_id,
        result: "FAILED_OR_RETRY",
        error: error?.message || String(error),
      };
    }
  }

  async runControlNotificationWorker() {
    const notifications = await this.fetchPendingNotifications(20);
    const results = [];

    for (const notification of notifications) {
      const result = await this.processNotification(notification);
      results.push(result);
    }

    return results;
  }
}

module.exports = ControlNotificationWorker;
