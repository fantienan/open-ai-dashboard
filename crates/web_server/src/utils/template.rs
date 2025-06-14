use askama::Template;

#[derive(Template)]
#[template(path = "email.html")]
struct EmailTemplate {
  verification_code: String,
}

pub fn gen_email_template(verification_code: &String) -> String {
  let template = EmailTemplate {
    verification_code: verification_code.to_string(),
  };
  template.render().unwrap()
}
