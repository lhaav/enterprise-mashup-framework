var email = new LiveValidation('email', { validMessage: " ", onlyOnBlur: true });
email.add(Validate.Presence, { failureMessage: "Missing" });
email.add(Validate.Email, { failureMessage: "Error" });

var password = new LiveValidation('password', { validMessage: " ", onlyOnBlur: true });
password.add(Validate.Presence, { failureMessage: "Missing" });