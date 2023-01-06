export const createError = (status, message) => {
    const err = new Error();//Error is class and err is object created
    err.status = status
    err.message = message || "sorry"
    return err;
}