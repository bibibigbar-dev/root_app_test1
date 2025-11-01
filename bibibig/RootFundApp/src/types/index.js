// JavaScript에서는 타입 정의가 필요하지 않으므로 이 파일을 삭제할 예정입니다.
// 대신 JSDoc 주석으로 타입 정보를 제공할 수 있습니다.

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} token
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} email
 * @property {string} password
 */

/**
 * @typedef {Object} LoginResponse
 * @property {boolean} success
 * @property {User} [user]
 * @property {string} [message]
 */

/**
 * @typedef {Object} WithdrawalRequest
 * @property {number} amount
 * @property {string} bankAccount
 * @property {string} bankName
 * @property {string} accountHolder
 */

/**
 * @typedef {Object} WithdrawalResponse
 * @property {boolean} success
 * @property {string} message
 * @property {string} [transactionId]
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {*} [data]
 * @property {string} [message]
 */
