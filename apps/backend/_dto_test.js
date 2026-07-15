"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const class_validator_1 = require("class-validator");
const onboarding_dto_1 = require("./src/auth/dto/onboarding.dto");
async function run(label, data) {
    const dto = Object.assign(new onboarding_dto_1.OnboardingDto(), data);
    const errors = await (0, class_validator_1.validate)(dto, { whitelist: true, forbidNonWhitelisted: true });
    const msgs = errors.map((e) => `${e.property}: ${Object.values(e.constraints || {}).join(',')}`);
    console.log(`${label} -> ${errors.length === 0 ? 'VALID' : 'INVALID [' + msgs.join(' | ') + ']'}`);
}
(async () => {
    await run('personal + companyEmail:""    ', { accountType: 'personal', email: 'me@x.com', companyEmail: '', country: 'Maroc', city: '', firstName: 'A' });
    await run('business + valid companyEmail ', { accountType: 'business', email: 'me@x.com', companyEmail: 'contact@co.ma' });
    await run('business + INVALID companyEmail', { accountType: 'business', email: 'me@x.com', companyEmail: 'not-an-email' });
})();
//# sourceMappingURL=_dto_test.js.map