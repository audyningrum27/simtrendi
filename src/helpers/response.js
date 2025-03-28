class response {
    static success(res, data = null, code = 200) {
        return res.status(code).json({ code, data });
    }

    static badRequest(res, error = null, code = 400) {
        return res.status(code).json({ code, error });
    }

    static internalServer(res, error = null, code = 500) {
        return res.status(code).json({ code, error });
    }
}

export default response;