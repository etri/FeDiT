const isValidUserLoginId = (userLoginId: string) => {
    const regex = /^(?=[\w.-]{5,20}$)(?:[\d_.-]*[a-z]){3}[\w.-]*$/i;
    return regex.test(userLoginId);
}

export { isValidUserLoginId };