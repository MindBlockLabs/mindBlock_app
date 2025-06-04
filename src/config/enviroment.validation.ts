// import * as Joi from 'joi'

// export default Joi.object({
//     NODE_ENV: Joi.string()
//     .valid('development', 'test', 'production', 'staging')
//     .default('development'),
//     DATABASE_PORT: Joi.number().port().default(5432),
//     DATABASE_PASSWORD: Joi.string().required(),
//     DATABASE_USER: Joi.string().required().default('postgres'),
//     DATABASE_HOST: Joi.string().required().default(''),
//     DATABASE_NAME: Joi.string().required()
// })