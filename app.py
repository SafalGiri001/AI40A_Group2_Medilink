from flask import Flask, render_template

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("homepage.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/login")
def login():
    return render_template("login-page.html")

@app.route("/signup")
def signup():
    return render_template("signup.html")

@app.route("/forgot-password")
def forgot_password():
    return render_template("forgot.html")

@app.route("/mfa")
def mfa():
    return render_template("mfa.html")

@app.route("/reset-code")
def reset_code():
    return render_template("reset-code.html")

@app.route("/reset-password")
def reset_password():
    return render_template("reset-password.html")

# Information pages
@app.route("/privacy-policy")
def privacy():
    return render_template("privacy-policy.html")

@app.route("/terms-of-use")
def terms():
    return render_template("terms-of-use.html")


@app.route("/profile")
@app.route("/index")
def profile():
    return render_template("profile management/index.html")

@app.route("/admin")
def admin():
    return render_template("Admin Management Portal/index.html")

if __name__ == "__main__":
    app.run(debug=True)
