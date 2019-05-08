require("dotenv").config()

const config = {
  expireTime: process.env.JWTEXPIRE,
  secrets: {
    JWT_SECRET: process.env.JWTSECRET
  },
  db: {
    url: process.env.DB_URL
  },
  keys: {
    s3: {
      accessKeyId: process.env.S3ACCESSKEYID,
      secretAccessKey: process.env.S3SECRETKEY,
      bucketName: process.env.S3BUCKET
    },
    ses: {
      sesRegion: process.env.SESREGION,
      accessKeyId: process.env.SESACCESSKEYID,
      secretAccessKey: process.env.SESSECRETKEY
    }
  },
  signup: {
    emailExpiry: process.env.SIGNUPEMAILEXPIRY,
    redirectSignInUrl: process.env.SIGNUPREDIRECTURL,
    requestConfirmUrl: process.env.SIGNUPCONFIRMURL,
    passwordResetUrl: process.env.PASSWORDRESETURL
  },
  systemEmails: {
    fromEmail: process.env.FROMEMAIL,
    defaultFromEmail: process.env.DEFAULTFROMEMAIL,
    sendingEmail: process.env.SENDINGEMAIL,
    replyToEmail: process.env.REPLYTOEMAIL
  },
  port: process.env.PORT
}

export default config
