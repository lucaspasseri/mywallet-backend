import joi from "joi";

const transactionsSchema = joi.object({
	amount: joi.number().integer().min(1).required(),
	description: joi.string().required()
});

export {
	transactionsSchema
};