export const sendToken = (user, statusCode, message, res) => {
  const token = user.generateToken();

  res.status(statusCode)
    .cookie("authToken", token, {
    expires: new Date(Date.now() + (Number(process.env.COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000),
      httpOnly: true,
    })
    .json({
      success: true,
      message,
      token,
      user
    });
};
