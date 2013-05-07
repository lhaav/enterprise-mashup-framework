var reg_email = new LiveValidation('reg_email', { validMessage: " ", onlyOnBlur: true });
reg_email.add(Validate.Presence, { failureMessage: "Missing" });
reg_email.add(Validate.Email, { failureMessage: "Error" });

var reg_password = new LiveValidation('reg_password', { validMessage: " ", onlyOnBlur: true });
reg_password.add(Validate.Presence, { failureMessage: "Missing" });

var reg_password2 = new LiveValidation('reg_password2', { validMessage: " ", onlyOnBlur: true });
reg_password2.add(Validate.Presence, { failureMessage: "Missing" });
reg_password2.add(Validate.Confirmation, { match: 'reg_password', failureMessage: "Do not match" });    