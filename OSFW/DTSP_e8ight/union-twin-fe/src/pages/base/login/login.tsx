import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { loginDTO } from 'types/login';
import { getCookie } from 'utils/cookie';
import './login.scss';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // TODO: change this yeayeay
  const user = true;

  const [credentials, setCredentials] = useState<loginDTO>({
    memberId: '',
    passwd: '',
  });
  const [isFormValid, setIsFormValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const accessToken = getCookie('accessToken');
    if (accessToken && user) {
      navigate(location.state?.from || '/');
    }

    setIsFormValid(
      credentials.memberId.trim() !== '' && credentials.passwd.trim() !== '',
    );
  }, [user, navigate, location, credentials]);

  const handleInputChange = (key: keyof loginDTO, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrorMessage('아이디와 비밀번호를 입력해 주세요');
      return;
    }

    try {
      const { memberId, passwd } = credentials;
      // console.log(memberId, passwd);
      setErrorMessage('계정을 확인해주세요');
    } catch (error: any) {
      const errMsg = `${error.response.data.title} : ${error.response.data.detail}`;
      // setAuth?.(null);
    }
  };
  return (
    <div className="login-div">
      <p>연합 트윈 3세부</p>
      <form className="login" onSubmit={handleSubmit}>
        {errorMessage && <div className="login__error-box">{errorMessage}</div>}
        <div className="login__input-wrapper">
          <input
            className="login__input"
            type="text"
            placeholder="아이디"
            value={credentials.memberId}
            onChange={(e) => handleInputChange('memberId', e.target.value)}
          />
          <input
            className="login__input"
            type="password"
            placeholder="비밀번호"
            value={credentials.passwd}
            onChange={(e) => handleInputChange('passwd', e.target.value)}
          />
        </div>
        <button className="login__button" type="submit" disabled={!isFormValid}>
          로그인
        </button>
        <span className="login__line">
          <span className="login__line-text">또는</span>
        </span>

        <NavLink to="/join">
          <button className="login__button" type="button">
            사용 신청
          </button>
        </NavLink>
      </form>
    </div>
  );
}
