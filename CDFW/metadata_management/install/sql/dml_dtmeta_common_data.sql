--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =====================================================================
-- common 스키마 초기 데이터 (설정/권한 체계) — 2026-07-24 dev DB 기준 정제
-- 실행 전제: ddl_dtmeta_common.sql 로 테이블 생성 완료.
-- =====================================================================

-- 플랫폼
COPY common.tb_com_platform (pltfrm_id, pltfrm_nm, pltfrm_desc, use_yn, odrg, reg_dt, regr_id, regr_nm, amd_dt, amdr_id, amdr_nm, main_scrn_exist_yn) FROM stdin;
iot	IoT	IoT 및 플랫폼공통	N	1	2023-01-05 00:00:00	system	시스템	\N	\N	\N	N
meta	Metadata	디지털트윈 메타데이터	Y	0	2023-02-08 00:00:00	system	시스템	\N	\N	\N	N
\.

-- 코드그룹
COPY common.tb_com_codegroup (cd_grp_id, cd_grp_nm, cd_grp_val, cd_grp_desc, up_cd_grp_id, use_yn, pltfrm_id, cd_type, reg_dt, regr_id, regr_nm, amd_dt, amdr_id, amdr_nm) FROM stdin;
CGR00001	포탈구분 그룹코드	POR_USE_TYPE	관리자/사용자등 포탈을 구분하는 용도로 사용 된다.	0	Y	iot	system	2023-01-19 00:00:00	system	시스템	\N	\N	\N
CGR00479	Q&A 상태	POR_QNA_STATUS	\N	0	Y	iot	system	2017-08-16 00:00:00	system	시스템	\N	\N	\N
CGR00472	권한 관리(일반/관리자)	AUTH_ADMIN_FLAG	\N	0	Y	iot	system	2017-02-17 00:00:00	system	시스템	\N	\N	\N
CGR00055	포탈 메뉴 Target 코드 그룹	POR_MENU_TARGET	\N	0	Y	iot	system	2020-11-23 00:00:00	system	시스템	\N	\N	\N
\.

-- 코드
COPY common.tb_com_code (cd_id, cd_grp_id, cd_nm, cd_val, cd_desc, up_cd_id, use_yn, odrg, ref_cd_nm, ref_cd_val, reg_dt, regr_id, regr_nm, amd_dt, amdr_id, amdr_nm) FROM stdin;
COD_00001	CGR00001	관리자메뉴	admin	\N	\N	Y	1	\N	\N	2023-01-16 00:00:00	system	시스템	\N	\N	\N
COD_00002	CGR00001	사용자메뉴	user	\N	\N	Y	2	\N	\N	2023-01-16 00:00:00	system	시스템	\N	\N	\N
COD_00676	CGR00055	_self	POR_MENU_TARGET_SELF	\N	\N	Y	1	\N	\N	2023-01-16 00:00:00	system	시스템	\N	\N	\N
COD_00677	CGR00055	_blank	POR_MENU_TARGET_BLANK	111	\N	Y	2	\N	\N	2023-01-16 00:00:00	system	시스템	\N	\N	\N
COD_02731	CGR00472	일반	N	권한 관리 일반 사용자	\N	Y	1	\N	\N	2023-01-16 00:00:00	system	시스템	\N	\N	\N
COD_02732	CGR00472	관리자	A	권한 관리 관리자	\N	Y	2	\N	\N	2023-01-16 00:00:00	system	시스템	\N	\N	\N
COD_02745	CGR00055	_popup	POR_MENU_TARGET_POPUP	\N	\N	Y	3	\N	\N	2023-01-16 00:00:00	system	시스템	\N	\N	\N
COD_02810	CGR00055	_window	POR_MENU_TARGET_WINDOW	외부 URL 팝업으로 주소창이 나오면서 전체화면 팝업을 띄움	\N	Y	4	\N	\N	2023-01-16 00:00:00	system	시스템	\N	\N	\N
COD_02828	CGR00479	답변대기	QNA_STATUS_WAIT	\N	\N	Y	1	\N	\N	2023-01-16 00:00:00	system	시스템	\N	\N	\N
COD_02829	CGR00479	답변완료	QNA_STATUS_COMPLETED	\N	\N	Y	2	\N	\N	2023-01-16 00:00:00	system	시스템	\N	\N	\N
\.

-- 사용자
COPY common.tb_com_user (user_oid, user_id, user_nm, tel_no, email, admr_yn, del_yn, last_login_dt, pwd_chg_dt, reg_dt, regr_id, regr_nm, amd_dt, amdr_id, amdr_nm) FROM stdin;
USR_METAADMIN	meta_admin	메타시스템관리자	00-000-0000	meta_admin@test.com	Y	N	\N	\N	2026-07-27 00:00:00	system	시스템	\N	\N	\N
USR_ADMIN	admin	admin	00-000-0000	admin@test.com	Y	N	\N	\N	2026-07-27 00:00:00	system	시스템	\N	\N	\N
USR_N2MIOT	n2m_iot	엔투엠1	00-000-0000	n2m@test.com	Y	N	\N	\N	2026-07-27 00:00:00	system	시스템	\N	\N	\N
USR_TESTER1	meta_tester1	메타데이터제공자1	00-000-0000	meta_tester1@test.com	N	N	\N	\N	2026-07-27 00:00:00	system	시스템	\N	\N	\N
USR_TESTER2	meta_tester2	메타데이터관리자2	00-000-0000	meta_tester2@test.com	N	N	\N	\N	2026-07-27 00:00:00	system	시스템	\N	\N	\N
USR_TESTER3	meta_tester3	메타데이터조회자3	00-000-0000	meta_tester3@test.com	N	N	\N	\N	2026-07-27 00:00:00	system	시스템	\N	\N	\N
USR_TESTER4	meta_tester4	메타데이터사용자4	00-000-0000	meta_tester4@test.com	N	N	\N	\N	2026-07-27 00:00:00	system	시스템	\N	\N	\N
USR_KETIDT	keti_dt	케티	00-000-0000	keti1@test.com	Y	N	\N	\N	2026-07-27 00:00:00	system	시스템	\N	\N	\N
\.

-- 메뉴
COPY common.tb_com_menu (menu_oid, menu_id, menu_nm, up_menu_oid, menu_desc, menu_tgt_cd, use_yn, url, url_param, type_cd, pltfrm_id, odrg, popup_yn, popup_wdth, popup_hght, admr_yn, reg_dt, regr_id, regr_nm, amd_dt, amdr_id, amdr_nm, menu_icon) FROM stdin;
1708478153246	MNU_000130	표준산업분류 코드 관리	1681966569345	표준산업분류 코드 관리	COD_00676	Y	/meta/stddata/ksiccode		COD_00001	meta	60	\N	\N	\N	Y	2024-02-21 10:15:53	system	시스템	\N	\N	\N	Files
1682402094469	MNU_000096	내 정보 (TODO)	1682402017103	내 정보	COD_00676	N	/meta/mypage/me		COD_00001	meta	50	\N	\N	\N	Y	2023-04-25 14:54:55	system	시스템	\N	\N	\N	User
1707120179652	MNU_000129	PAT 관리	1682402017103	PAT 관리	COD_00676	Y	/meta/mypage/pat		COD_00001	meta	40	\N	\N	\N	Y	2024-02-05 17:03:00	system	시스템	\N	\N	\N	Money
1753838128973	MNU_000140	지형지물 코드 관리	1681966569345	지형지물 코드 관리 메뉴	COD_00676	Y	/meta/stddata/featurecode		COD_00001	meta	100	\N	\N	\N	Y	2025-07-30 10:15:29	n2m_iot	엔투엠1	2025-07-30 10:50:01	solee	소리님	LocationInformation
1682402167018	MNU_000087	메타데이터 수집 - XXX	0	메타데이터 수집. 수집 기능 테스트. 더이상 사용안함.	COD_00676	N	\N		COD_00001	meta	60	\N	\N	\N	Y	2023-04-25 14:56:07	system	시스템	2025-08-27 16:56:38	meta_admin	메타시스템관리자	Paperclip
1737363865006	MNU_000138	키워드 현황	1681966425260		COD_00676	Y	/meta/search/keywordchart		COD_00001	meta	70	\N	\N	\N	Y	2025-01-20 18:04:25	meta_admin	메타시스템관리자	2025-02-07 14:30:11	meta_admin	메타시스템관리자	Reading
1722926321863	MNU_000135	메타데이터 통합 검색	1681966425260	메타데이터 통합 검색	COD_00676	Y	/meta/search/intgrdata		COD_00001	meta	5	\N	\N	\N	Y	2024-08-06 15:38:42	tklee1995	택규	2025-09-30 18:01:12	keti.user01	KETI연구원1	Management
1739437934191	MNU_000139	메타데이터 변경이력 조회	1681966455502	메타데이터 변경이력 조회. 메타데이터 변경 시, 적재되는 Influx DB 조회.	COD_00676	Y	/meta/manage/influxdb-revision		COD_00001	meta	80	\N	\N	\N	Y	2025-02-13 18:12:14	solee	소리님	2025-02-14 09:48:36	solee	소리님	DataLine
1723597166991	MNU_000136	Elasticsearch Query DSL	1681966425260	Elasticsearch Query DSL	COD_00676	Y	/meta/search/elasticsearch		COD_00001	meta	60	\N	\N	\N	Y	2024-08-14 09:59:27	tklee1995	택규	2024-08-14 10:18:23	tklee1995	택규	MagicStick
1778049009203	MNU_000142	통합 검색	1681966425260		COD_00676	Y	/meta/search/discovery		COD_00001	meta	3	\N	\N	\N	Y	2026-05-06 15:30:09	meta_admin	메타시스템관리자	2026-05-07 14:07:20	meta_admin	메타시스템관리자	Flag
1721119727537	MNU_000134	메타데이터 관리(외부용) - TEST	0	메타데이터 관리(외부용) - TEST	COD_00676	N	/meta/external/dt		COD_00001	meta	99999	\N	\N	\N	Y	2024-07-16 17:48:48	heenim	★희님★	2024-10-07 09:35:19	n2m_iot	엔투엠1	DataBoard
1733460807842	MNU_000137	캐시 관리	1681965530796	모델, 프라퍼티, RDF매핑, 코드 캐시 데이터 관리	COD_00676	Y	/meta/system/cache		COD_00001	meta	80	\N	\N	\N	Y	2024-12-06 13:53:28	tklee1995	택규	\N	\N	\N	RefreshRight
1708478238863	MNU_000131	공공자원분류 코드 관리	1681966569345	공공자원분류 코드 관리	COD_00676	Y	/meta/stddata/pbrccode		COD_00001	meta	70	\N	\N	\N	Y	2024-02-21 10:17:19	system	시스템	\N	\N	\N	MessageBox
1759222852485	MNU_000141	RAG 검색	1681966425260		COD_00676	Y	/meta/search/ragsearch		COD_00001	meta	2	\N	\N	\N	Y	2025-09-30 18:00:53	meta_admin	메타시스템관리자	2025-09-30 18:01:33	meta_admin	메타시스템관리자	ChatLineSquare
1676537182223	MNU_000052	나의 가상 디바이스	1676536982186	platform	COD_00676	Y	/platform/my_device/simulator		COD_00002	iot	3	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1708478389618	MNU_000132	물품분류 코드 관리	1681966569345	물품분류 코드 관리	COD_00676	Y	/meta/stddata/productcode		COD_00001	meta	80	\N	\N	\N	Y	2024-02-21 10:19:50	system	시스템	\N	\N	\N	Van
1708478512851	MNU_000133	시설분류 코드 관리	1681966569345	시설분류 코드 관리	COD_00676	Y	/meta/stddata/facilitycode		COD_00001	meta	90	\N	\N	\N	Y	2024-02-21 10:21:53	system	시스템	\N	\N	\N	OfficeBuilding
1682402271874	MNU_000097	내 디지털트윈	1682402017103	내 디지털트윈	COD_00676	Y	/meta/mypage/dt		COD_00001	meta	20	\N	\N	\N	Y	2023-04-25 14:57:52	system	시스템	\N	\N	\N	DataBoard
1682398964622	MNU_000100	디지털트윈 검색	1681966425260	디지털트윈 검색	COD_00676	Y	/meta/search/dt		COD_00001	meta	10	\N	\N	\N	Y	2023-04-25 14:02:45	system	시스템	\N	\N	\N	LocationFilled
1682399002693	MNU_000101	메타데이터 셋 검색	1681966425260	메타데이터 셋 검색	COD_00676	Y	/meta/search/dataset		COD_00001	meta	20	\N	\N	\N	Y	2023-04-25 14:03:23	system	시스템	\N	\N	\N	OfficeBuilding
1682399033827	MNU_000102	메타데이터 검색	1681966425260	메타데이터 검색	COD_00676	Y	/meta/search/data		COD_00001	meta	30	\N	\N	\N	Y	2023-04-25 14:03:54	system	시스템	\N	\N	\N	School
1681969688418	MNU_000091	코드 관리	1681965530796	공통 코드 관리 - IOT 공통 코드로 메타데이터에서 따로 사용하지 않음.	COD_00676	N	/meta/system/code		COD_00001	meta	70	\N	\N	\N	Y	2023-04-20 14:48:08	system	시스템	\N	\N	\N	Orange
1698281589200	MNU_000127	수집 작업 목록	1682402167018	메타데이터 수집 작업	COD_00676	Y	/meta/collection/work		COD_00001	meta	10	\N	\N	\N	Y	2023-10-26 09:53:09	system	시스템	\N	\N	\N	Checked
1699405773956	MNU_000128	SPARQL Query	1681966425260	SPARQL Query	COD_00676	Y	/meta/search/sparql		COD_00001	meta	50	\N	\N	\N	Y	2023-11-08 10:09:34	system	시스템	\N	\N	\N	Search
1676883618921	MNU_000054	디바이스관리	0	삭제금지	COD_00676	Y	/iot/device		COD_00001	iot	112	\N	\N	\N	Y	2023-02-20 00:00:00	system	시스템	\N	\N	\N	\N
1693378620159	MNU_000123	저장소 데이터 관리	1681965530796	RDF 그래프 관리. 그래프 초기화. 데이터 수동 등록 등. 저장소 데이터 관리	COD_00676	Y	/meta/system/rdfgraph		COD_00001	meta	20	\N	\N	\N	Y	2023-08-30 15:57:00	system	시스템	2025-02-06 14:51:52	meta_admin	메타시스템관리자	Orange
1680243202155	MNU_000074	리소스템플릿관리	0	삭제금지	COD_00676	Y	/iot/restmplt		COD_00001	iot	113	\N	\N	\N	Y	2023-03-31 00:00:00	system	시스템	\N	\N	\N	\N
1695105172143	MNU_000125	디지털트윈 리소스 트리	1681966425260	디지털트윈 리소스 트리	COD_00676	Y	/meta/search/resourcetree		COD_00001	meta	40	\N	\N	\N	Y	2023-09-19 15:32:52	system	시스템	\N	\N	\N	Lollipop
1681974843873	MNU_000088	사용자 관리	1681965530796	인증인가 서버의 사용자 정보 중 일부와 meta 용 필드를 관리 - 인증서버 사용으로 사용자 관리 여기서 하지 않음.	COD_00676	Y	/meta/system/user		COD_00001	meta	30	\N	\N	\N	Y	2023-04-20 16:14:04	system	시스템	\N	\N	\N	User
1676536850313	MNU_000044	문의/안내	1676536712852	platform	COD_00676	Y	\N		COD_00002	iot	2	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1673582536973	MNU_000032	언론 보도	1673582472077	삭제금지	COD_00676	Y	/iot/bbsposting	brdOid=1675410633608	COD_00001	iot	10701	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	\N
1673582536971	MNU_000031	서비스관리	0	삭제금지	COD_00676	Y	/iot/service	\N	COD_00001	iot	111	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	\N
1673582523009	MNU_000030	이미지관리	0	삭제금지	COD_00676	Y	/iot/image	\N	COD_00001	iot	110	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	\N
1673582536975	MNU_000034	커뮤니티 공간	1673582472077	삭제금지	COD_00676	Y	/iot/bbsposting	brdOid=1675410649501	COD_00001	iot	10703	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	\N
1676594974065	MNU_000053	디바이스 관리	1676536555309	platform	COD_00676	Y	/platform/device	upMenuOid=1676536555309	COD_00002	iot	1	\N	\N	\N	N	2023-02-17 00:00:00	system	시스템	\N	\N	\N	\N
1673582504362	MNU_000029	QNA관리	0	삭제금지	COD_00676	Y	/iot/qna	\N	COD_00001	iot	109	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	\N
1673582536974	MNU_000033	매뉴얼	1673582472077	삭제금지	COD_00676	Y	/iot/bbsposting	brdOid=1675410707683	COD_00001	iot	10702	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	\N
1673582491809	MNU_000028	FAQ관리	0	삭제금지	COD_00676	Y	/iot/faq	\N	COD_00001	iot	108	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	\N
1676536960281	MNU_000048	마이페이지	0	platform	COD_00676	Y	\N	\N	COD_00002	iot	40	\N	\N	\N	\N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1676536816296	MNU_000043	매뉴얼	1676536781932	platform	COD_00676	Y	/platform/boardmessage	brdOid=1507894060932	COD_00002	iot	1	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1673582374364	MNU_000025	공지사항관리	0	삭제금지	COD_00676	Y	/iot/notice	\N	COD_00001	iot	105	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	\N
1673582472077	MNU_000027	게시글관리	0	삭제금지	COD_00676	Y	\N	\N	COD_00001	iot	107	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	\N
1673580388355	MNU_000023	코드관리	0	삭제금지	COD_00676	Y	/iot/code	\N	COD_00001	iot	103	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	\N
1687928770886	MNU_000120	국가코드 관리	1681966569345	국가코드 관리. 불필요할시 메뉴 숨길 것.	COD_00676	Y	/meta/stddata/countrycode		COD_00001	meta	50	\N	\N	\N	Y	2023-06-28 14:06:11	system	시스템	\N	\N	\N	Help
1676536982186	MNU_000049	나의 IoT	1676536960281	platform	COD_00676	Y	\N		COD_00002	iot	1	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1673582312367	MNU_000024	사용자관리	0	삭제금지	COD_00676	Y	/iot/user	\N	COD_00001	iot	104	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	User
1676536781932	MNU_000042	개발 지원	1676536712852	platform	COD_00676	Y	\N		COD_00002	iot	1	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1676536712852	MNU_000041	개발자 지원	0	platform	COD_00676	Y	\N		COD_00002	iot	30	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1676536555309	MNU_000038	디바이스	0	platform	COD_00676	Y	\N		COD_00002	iot	20	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1676537021868	MNU_000050	나의 서비스	1676536982186	platform	COD_00676	Y	/platform/my_service		COD_00002	iot	1	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1676537047138	MNU_000051	나의 디바이스	1676536982186	platform	COD_00676	Y	/platform/my_device		COD_00002	iot	2	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1676536629486	MNU_000039	디바이스 조회	1676594974065	platform	COD_00676	Y	/platform/device	upMenuOid=1676536555309	COD_00002	iot	1	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1676536668284	MNU_000040	디바이스 트래킹	1676594974065	platform	COD_00676	Y	/platform/device/tracking	upMenuOid=1676536555309	COD_00002	iot	2	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1676536889873	MNU_000045	FAQ	1676536850313	platform	COD_00676	Y	/platform/faq		COD_00002	iot	1	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1676536910644	MNU_000046	Q&A	1676536850313	platform	COD_00676	Y	/platform/qna		COD_00002	iot	2	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1676536508694	MNU_000037	서비스	0	platform	COD_00676	Y	/platform/service		COD_00002	iot	10	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	\N
1676536936358	MNU_000047	공지사항	1676536850313	platform	COD_00676	Y	/platform/notice		COD_00002	iot	3	\N	\N	\N	N	2023-02-16 00:00:00	system	시스템	\N	\N	\N	ChatLineSquare
1673582444859	MNU_000026	게시판관리	0	삭제금지	COD_00676	Y	/iot/bbs	\N	COD_00001	iot	106	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	ChatLineSquare
1682398225402	MNU_000117	키워드 관리	1681966569345	키워드 관리	COD_00676	N	/meta/stddata/keyword		COD_00001	meta	20	\N	\N	\N	Y	2023-04-25 13:50:25	system	시스템	\N	\N	\N	\N
1678175161152	MNU_000070	API 관리	0	삭제 금지	COD_00676	Y	/iot/api		COD_00001	iot	114	\N	\N	\N	Y	2023-03-07 00:00:00	system	시스템	\N	\N	\N	Postcard
1673577740362	MNU_000022	권한관리	0	삭제금지	COD_00676	Y	/iot/auth	\N	COD_00001	iot	102	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	Lock
1673577692399	MNU_000021	메뉴관리	0	삭제금지	COD_00676	Y	/iot/menu	\N	COD_00001	iot	101	N	\N	\N	Y	2023-01-13 00:00:00	system	시스템	\N	\N	\N	Menu
1682399102742	MNU_000103	디지털트윈 관리	1681966455502	디지털트윈 관리	COD_00676	Y	/meta/manage/dt		COD_00001	meta	10	\N	\N	\N	Y	2023-04-25 14:05:03	system	시스템	\N	\N	\N	DataBoard
1682398522757	MNU_000094	FAQ 관리	1681966604809	FAQ 관리. Frequently Asked Questions. 자주 묻는 질문	COD_00676	Y	/meta/board/faq		COD_00001	meta	20	\N	\N	\N	Y	2023-04-25 13:55:23	system	시스템	\N	\N	\N	Star
1682398630504	MNU_000095	QNA 관리	1681966604809	QNA 관리. Question & Answer	COD_00676	Y	/meta/board/qna		COD_00001	meta	30	\N	\N	\N	Y	2023-04-25 13:57:11	system	시스템	\N	\N	\N	Service
1682399159028	MNU_000104	메타데이터 관리	1681966455502	메타데이터 관리	COD_00676	Y	/meta/manage/dataset		COD_00001	meta	20	\N	\N	\N	Y	2023-04-25 14:05:59	system	시스템	\N	\N	\N	DataAnalysis
1681969773156	MNU_000092	API 관리	1681965530796	공통 API 관리	COD_00676	Y	/meta/system/api		COD_00001	meta	60	\N	\N	\N	Y	2023-04-20 14:49:33	system	시스템	\N	\N	\N	Postcard
1681966604809	MNU_000081	게시판 관리	0	게시판 관리	COD_00676	Y	\N		COD_00001	meta	70	\N	\N	\N	Y	2023-04-20 13:56:45	system	시스템	\N	\N	\N	List
1682402017103	MNU_000082	마이페이지	0	마이페이지	COD_00676	Y	\N		COD_00001	meta	10	\N	\N	\N	Y	2023-04-25 14:53:37	system	시스템	\N	\N	\N	UserFilled
1681966746942	MNU_000089	권한 관리	1681965530796	공통 권한 관리	COD_00676	Y	/meta/system/auth		COD_00001	meta	40	\N	\N	\N	Y	2023-04-20 13:59:07	system	시스템	\N	\N	\N	Lock
1681966494939	MNU_000086	메타데이터 설정	0	메타데이터 설정	COD_00676	Y	\N		COD_00001	meta	40	\N	\N	\N	Y	2023-04-20 13:54:55	system	시스템	\N	\N	\N	Setting
1681965530796	MNU_000080	시스템 관리	0	공통 시스템관리	COD_00676	Y	\N		COD_00001	meta	90	\N	\N	\N	Y	2023-04-20 13:39:01	system	시스템	\N	\N	\N	Tools
1681966455502	MNU_000084	메타데이터 관리	0	메타데이터 관리	COD_00676	Y	\N		COD_00001	meta	30	\N	\N	\N	Y	2023-04-20 13:54:16	system	시스템	\N	\N	\N	DataLine
1681966569345	MNU_000085	기준데이터 관리	0	기준데이터 관리	COD_00676	Y	\N		COD_00001	meta	50	\N	\N	\N	Y	2023-04-20 13:56:09	system	시스템	\N	\N	\N	Operation
1681966652759	MNU_000090	메뉴 관리	1681965530796	공통 메뉴 관리	COD_00676	Y	/meta/system/menu		COD_00001	meta	50	\N	\N	\N	Y	2023-04-20 13:57:33	system	시스템	\N	\N	\N	Menu
1682398453020	MNU_000093	공지사항 관리	1681966604809	공지사항 관리	COD_00676	Y	/meta/board/notice		COD_00001	meta	10	\N	\N	\N	Y	2023-04-25 13:54:13	system	시스템	\N	\N	\N	ChatLineSquare
1682398131762	MNU_000116	카테고리 관리	1681966569345	카테고리(분류체계) 관리	COD_00676	Y	/meta/stddata/category		COD_00001	meta	10	\N	\N	\N	Y	2023-04-25 13:48:52	system	시스템	\N	\N	\N	Grape
1682399499137	MNU_000107	메타데이터 프라퍼티 관리	1681966494939	메타데이터 프라퍼티 관리	COD_00676	Y	/meta/setting/property		COD_00001	meta	20	\N	\N	\N	Y	2023-04-25 14:11:39	system	시스템	\N	\N	\N	Memo
1682398060600	MNU_000118	대리인(제공자) 관리 - XXX	1681966569345	대리인(제공자) 관리 (정형 모델에서 비정형 모델로 변경. 이 메뉴 사용하면 안됨!)	COD_00676	N	/meta/stddata/agent		COD_00001	meta	30	\N	\N	\N	Y	2023-04-25 13:47:41	system	시스템	\N	\N	\N	WalletFilled
1682399684317	MNU_000110	메타데이터 표준 모델 관리	1681966494939	메타데이터 표준 모델 관리	COD_00676	Y	/meta/setting/stdmodel		COD_00001	meta	50	\N	\N	\N	Y	2023-04-25 14:14:44	system	시스템	\N	\N	\N	Collection
1682399624683	MNU_000109	메타데이터 유형 모델 관리	1681966494939	메타데이터 유형 모델 프라퍼티 관리	COD_00676	Y	/meta/setting/typemodelproperty		COD_00001	meta	40	\N	\N	\N	Y	2023-04-25 14:13:45	system	시스템	\N	\N	\N	Wallet
1682402480985	MNU_000112	RDF 네임스페이스 관리	1681966494939	RDF 네임스페이스 관리	COD_00676	Y	/meta/setting/rdfnamespace		COD_00001	meta	70	\N	\N	\N	Y	2023-04-25 15:01:21	system	시스템	\N	\N	\N	Files
1682399419740	MNU_000108	메타데이터 유형 관리	1681966494939	메타데이터 유형 모델 관리	COD_00676	Y	/meta/setting/typemodel		COD_00001	meta	30	\N	\N	\N	Y	2023-04-25 14:10:20	system	시스템	\N	\N	\N	Folder
1682402560208	MNU_000113	RDF 프라퍼티 관리	1681966494939	RDF 프라퍼티 관리	COD_00676	Y	/meta/setting/rdfproperty		COD_00001	meta	80	\N	\N	\N	Y	2023-04-25 15:02:40	system	시스템	\N	\N	\N	ScaleToOriginal
1682402593019	MNU_000114	RDF 클래스 관리	1681966494939	RDF 클래스 관리	COD_00676	Y	/meta/setting/rdfclass		COD_00001	meta	90	\N	\N	\N	Y	2023-04-25 15:03:13	system	시스템	\N	\N	\N	Cpu
1682399325616	MNU_000105	디지털트윈 사용요청 확인 (X : 미구현!)	1681966455502	디지털트윈 사용요청 확인 (등록 후 사용을 위한 요청을 확인 처리하기 위한 메뉴)	COD_00676	N	/meta/manage/confirm		COD_00001	meta	30	\N	\N	\N	Y	2023-04-25 14:08:46	system	시스템	\N	\N	\N	DocumentChecked
1682402308067	MNU_000098	내 문의내역	1682402017103	내 문의내역	COD_00676	Y	/meta/mypage/qna		COD_00001	meta	30	\N	\N	\N	Y	2023-04-25 14:58:28	system	시스템	\N	\N	\N	EditPen
1681780796529	MNU_000111	메타데이터 코드 관리	1681966494939	메타데이터 코드 관리	COD_00676	Y	/meta/setting/code		COD_00001	meta	60	\N	\N	\N	Y	2023-04-18 00:00:00	system	시스템	\N	\N	\N	Coin
1682402632618	MNU_000115	RDF 모델 매핑	1681966494939	RDF 모델 매핑	COD_00676	Y	/meta/setting/rdfmapping		COD_00001	meta	100	\N	\N	\N	Y	2023-04-25 15:03:53	system	시스템	\N	\N	\N	Connection
1682403560715	MNU_000119	전자명함(관리담당연락처) 관리 (X : 미구현!)	1681966569345	전자명함(관리담당연락처) 관리	COD_00676	N	/meta/stddata/vcard		COD_00001	meta	40	\N	\N	\N	Y	2023-04-25 15:19:21	system	시스템	\N	\N	\N	CreditCard
1682067336223	MNU_000106	메타데이터 DataType 모델 관리	1681966494939	메타데이터 DataType 모델 관리	COD_00676	Y	/meta/setting/datamodel		COD_00001	meta	10	\N	\N	\N	Y	2023-04-21 17:55:36	system	시스템	\N	\N	\N	Notebook
1682402341877	MNU_000099	내 알림	1682402017103	내 알림	COD_00676	Y	/meta/mypage/notifc		COD_00001	meta	10	\N	\N	\N	Y	2023-04-25 14:59:02	system	시스템	\N	\N	\N	Bell
1691461287601	MNU_000121	알림 유형 관리	1681965530796	알림 설정. 알림 유형 관리. 대상 관리. (관리자용)	COD_00676	Y	/meta/system/notification		COD_00001	meta	10	\N	\N	\N	Y	2023-08-08 02:21:28	system	시스템	\N	\N	\N	DishDot
1681966425260	MNU_000083	메타데이터 검색	0	메타데이터 검색	COD_00676	Y	\N		COD_00001	meta	20	\N	\N	\N	Y	2023-04-20 13:53:46	system	시스템	\N	\N	\N	Aim
1692681928948	MNU_000122	RDF 시각 그래프	1681966455502	RDF 시각 그래프	COD_00676	Y	/meta/manage/rdfgraph		COD_00001	meta	40	\N	\N	\N	Y	2023-08-22 14:25:29	system	시스템	\N	\N	\N	Sunny
1694741596974	MNU_000124	메타데이터 시각 그래프	1681966455502	메타데이터 시각 그래프	COD_00676	Y	/meta/manage/medatagraph		COD_00001	meta	30	\N	\N	\N	Y	2023-09-15 10:33:17	system	시스템	\N	\N	\N	Loading
1698281199007	MNU_000126	수집 로그 목록	1682402167018	메타데이터 수집 로그 목록	COD_00676	Y	/meta/collection/log		COD_00001	meta	20	\N	\N	\N	Y	2023-10-26 09:46:39	system	시스템	\N	\N	\N	Collection
\.

-- API 그룹
COPY common.tb_com_apigroup (api_grp_oid, api_grp_nm, api_grp_desc, use_yn, pltfrm_id, reg_dt, regr_id, regr_nm, amd_dt, amdr_id, amdr_nm) FROM stdin;
1701393170121	[시스템] Elasticsearch 관리	Elasticsearch 관리	Y	meta	2023-12-01 10:12:50	system	시스템	\N	\N	\N
1708490013806	[시스템] 식별체계 코드 관리	식별체계 코드 관리	Y	meta	2024-02-21 13:33:34	system	시스템	\N	\N	\N
1707187116687	[운영] PAT 관리	PAT 관리	Y	meta	2024-02-06 11:38:37	system	시스템	\N	\N	\N
1678257466870	코드 관리	코드 관리 메뉴 API	Y	iot	2023-03-08 15:37:47	system	시스템	\N	\N	\N
1678260012068	사용자 관리	사용자 관리 메뉴 API	Y	iot	2023-03-08 16:20:12	system	시스템	\N	\N	\N
1678260074028	공지사항 관리	공지사항 관리 메뉴 API	Y	iot	2023-03-08 16:21:14	system	시스템	\N	\N	\N
1678260449549	게시판 관리	게시판 관리 메뉴 API	Y	iot	2023-03-08 16:27:30	system	시스템	\N	\N	\N
1678260568838	게시글 관리	게시글 관리 메뉴 API	Y	iot	2023-03-08 16:29:29	system	시스템	\N	\N	\N
1722997869800	[사용] 메타데이터 검색 (TODO)	메타데이터 검색	Y	meta	2024-08-07 11:31:10	tklee1995	택규	2024-08-07 11:34:01	tklee1995	택규
1733707070122	[시스템] 캐시 관리	캐시 관리	Y	meta	2024-12-09 10:17:50	tklee1995	택규	\N	\N	\N
1737016374758	[사용] InfluxDB 조회	InfluxDB 조회	Y	meta	2025-01-16 17:32:55	meta_admin	메타시스템관리자	2025-02-11 11:13:44	solee	소리님
1753168197084	[시스템] Vector 관리	Vector database 관리	Y	meta	2025-07-22 16:09:57	n2m_iot	엔투엠1	\N	\N	\N
1678260904747	FAQ 관리	FAQ 관리 메뉴 API	Y	iot	2023-03-08 16:35:05	system	시스템	\N	\N	\N
1678261033803	QNA 관리	QNA 관리 메뉴 API	Y	iot	2023-03-08 16:37:14	system	시스템	\N	\N	\N
1678261700799	서비스 관리	서비스 관리 메뉴 API	Y	iot	2023-03-08 16:48:21	system	시스템	\N	\N	\N
1678261963107	API 관리	API 관리 메뉴 API	Y	iot	2023-03-08 16:52:43	system	시스템	\N	\N	\N
1678255242692	권한 관리	권한 관리 메뉴 API	Y	iot	2023-03-08 15:00:43	system	시스템	\N	\N	\N
1680151086561	공통 관리	공통 관리 API	Y	iot	2023-03-30 13:38:07	system	시스템	\N	\N	\N
1678261146503	이미지 관리	이미지 관리 메뉴 API	Y	iot	2023-03-08 16:39:07	system	시스템	\N	\N	\N
1678254509790	메뉴 관리	메뉴관리 관련 API	Y	iot	2023-03-08 14:48:30	system	시스템	\N	\N	\N
1697001445182	[기본] 마이페이지	마이페이지 관련. 메타데이터 기본 사용자라면 할 수 있는 기능.	Y	meta	2023-10-11 14:17:25	system	시스템	\N	\N	\N
1692326675810	[시스템] 알림 유형 관리	알림 유형 관리	Y	meta	2023-08-18 11:44:36	system	시스템	\N	\N	\N
1696922694251	[시스템] 그래프 DB (Neo4j) 관리	그래프 DB (Neo4j) 관리	Y	meta	2023-10-10 16:24:54	system	시스템	\N	\N	\N
1696913843077	[시스템] 그래프 DB (버투소) 관리	그래프 DB (버투소) 관리	Y	meta	2023-10-10 13:57:23	system	시스템	\N	\N	\N
1697001834043	[기본] 게시판 서비스	게시판 기본 관련 - 공지사항 조회, FAQ 조회, QNA 문의 등록/조회/수정/삭제 등	Y	meta	2023-10-11 14:23:54	system	시스템	\N	\N	\N
1692333540000	[시스템] COMMON 사용자 관리	사용자 관리 메뉴 API	Y	meta	2023-03-08 16:20:12	system	시스템	\N	\N	\N
1692333550000	[시스템] COMMON 권한 관리	권한 관리 메뉴 API	Y	meta	2023-03-08 15:00:43	system	시스템	\N	\N	\N
1692333560000	[시스템] COMMON 메뉴 관리	메뉴관리 관련 API	Y	meta	2023-03-08 14:48:30	system	시스템	\N	\N	\N
1692333570000	[시스템] COMMON API 관리	API 관리 메뉴 API	Y	meta	2023-03-08 16:52:43	system	시스템	\N	\N	\N
1692333580000	[시스템] COMMON 코드 관리	코드 관리 메뉴 API	Y	meta	2023-03-08 15:37:47	system	시스템	\N	\N	\N
1738821673217	[시스템] InfluxDB 관리	InfluxDB 관리	Y	meta	2025-02-06 15:01:13	meta_admin	메타시스템관리자	2025-02-06 15:02:16	meta_admin	메타시스템관리자
1754903956578	[운영] 레지스트리 인터페이스 관리 (외부 API용)	레지스트리 인터페이스 관리 (외부 API용)	Y	meta	2025-08-11 18:19:17	meta_admin	메타시스템관리자	2025-08-11 18:20:43	meta_admin	메타시스템관리자
1678260100000	[운영] COMMON 공지사항 관리	공지사항 관리 메뉴 API	Y	meta	2023-03-08 16:21:14	system	시스템	\N	\N	\N
1678260110000	[운영] COMMON FAQ 관리	FAQ 관리 메뉴 API	Y	meta	2023-03-08 16:35:05	system	시스템	\N	\N	\N
1678260120000	[운영] COMMON QNA 관리	QNA 관리 메뉴 API	Y	meta	2023-03-08 16:37:14	system	시스템	\N	\N	\N
1692334515538	[운영] 메타데이터 프라퍼티 관리	메타데이터 프라퍼티 관리 API	Y	meta	2023-08-18 13:55:16	system	시스템	\N	\N	\N
1692334729497	[운영] 메타데이터 유형 모델 관리	메타데이터 유형 API	Y	meta	2023-08-18 13:58:50	system	시스템	\N	\N	\N
1692334854665	[운영] 메타데이터 모델 프라퍼티 관리	메타데이터 모델 프라퍼티 API	Y	meta	2023-08-18 14:00:55	system	시스템	\N	\N	\N
1692335211578	[운영] 메타데이터 표준 모델 관리	메타데이터 표준 모델 API	Y	meta	2023-08-18 14:06:52	system	시스템	\N	\N	\N
1692334188123	[운영] 메타데이터 모델 관리	메타데이터 모델 API	Y	meta	2023-08-18 13:49:48	system	시스템	\N	\N	\N
1692333947468	[운영] 메타데이터 DataType 모델 관리	메타데이터 DataType API	Y	meta	2023-08-18 13:45:47	system	시스템	\N	\N	\N
1683086628995	[운영] 카테고리 관리	카테고리 관리 메뉴 API	Y	meta	2023-05-03 13:03:49	system	시스템	\N	\N	\N
1683181683641	[운영] 국가코드 관리	공통 국가코드 관리 API	Y	meta	2023-05-04 15:28:04	system	시스템	\N	\N	\N
1684374309665	[운영] 메타데이터 관리	메타데이터 관리 API (화면용)	Y	meta	2023-05-18 10:45:10	system	시스템	\N	\N	\N
1684137482763	[운영] RDF 네임스페이스 관리	RDF 네임스페이스 관리 API	Y	meta	2023-05-15 16:58:03	system	시스템	\N	\N	\N
1682052959775	[운영] 메타데이터 코드 관리	메타데이터 코드 관리 API	Y	meta	2023-04-21 13:56:00	system	시스템	\N	\N	\N
1682577494093	[운영] 대리인(제공자) 관리	대리인(제공자) 관리 API	Y	meta	2023-04-27 15:38:14	system	시스템	\N	\N	\N
1692331647806	[운영] RDF 클래스 관리	RDF 클래스 관리 API	Y	meta	2023-08-18 13:07:28	system	시스템	\N	\N	\N
1692332647322	[운영] RDF 프라퍼티 관리	RDF 프라퍼티 관리 API	Y	meta	2023-08-18 13:24:07	system	시스템	\N	\N	\N
1692332995430	[운영] RDF 모델 매핑	RDF 모델 매핑 API	Y	meta	2023-08-18 13:29:55	system	시스템	\N	\N	\N
1697090069772	[사용] 메타데이터 검색	메타데이터 검색 관련	Y	meta	2023-10-12 14:54:30	system	시스템	\N	\N	\N
1697095431263	[기본] 코드 조회	코드성 데이터 조회	Y	meta	2023-10-12 16:23:51	system	시스템	\N	\N	\N
1697097728017	[사용] Neo4j 그래프 조회	Neo4j 그래프 조회	Y	meta	2023-10-12 17:02:08	system	시스템	\N	\N	\N
1698026390150	[운영] (외부 API용) 리소스 관리	(외부 API용) 리소스 관리	Y	meta	2023-10-23 10:59:50	system	시스템	\N	\N	\N
1698026390160	[운영] (외부 API용) 리소스 조회	(외부 API용) 리소스 조회	Y	meta	2023-10-23 10:59:50	system	시스템	\N	\N	\N
1699417573146	[사용] SPARQL 쿼리 실행	버투소 SPARQL 쿼리 실행	Y	meta	2023-11-08 13:26:13	system	시스템	\N	\N	\N
1698213521356	[운영] 메타데이터 수집 관리	메타데이터 수집 API	Y	meta	2023-10-25 14:58:41	system	시스템	\N	\N	\N
\.

-- API
COPY common.tb_com_api (api_oid, api_grp_oid, api_nm, api_desc, api_url, mthd_cd, use_yn, reg_dt, regr_id, regr_nm, amd_dt, amdr_id, amdr_nm) FROM stdin;
1678255096998	1678254509790	getMenuList	메뉴 전체 리스트 조회	/admin/menu	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255050007	1678254509790	getUserMenu	user 권한에 근거하여 메뉴 리스트 조회	/admin/usermenu	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255141234	1678254509790	setMenuDetail	메뉴 등록	/admin/menu	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255179309	1678254509790	getMenuDetail	메뉴 상세 조회	/admin/menu/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255197876	1678254509790	modifyMenuDetail	메뉴 수정	/admin/menu/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255216785	1678254509790	deleteMenuDetail	메뉴 삭제	/admin/menu/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255386072	1678255242692	getAuthList	권한 페이징 리스트 조회	/admin/authPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255411111	1678255242692	getAuthDetail	권한 상세 조회	/admin/auth/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260329003	1678260074028	setNoticeDetail	공지사항 등록	/admin/notice	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255464728	1678255242692	modifyAuthDetail	권한 수정	/admin/auth/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255483892	1678255242692	deleteAuthDetail	권한 삭제	/admin/auth/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260346036	1678260074028	modifyNoticeDetail	공지사항 수정	/admin/notice/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260363708	1678260074028	deleteNoticeDetail	공지사항 삭제	/admin/notice/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255671158	1678255242692	deleteAuthUsers	해당 권한 사용이 가능한 사용자 리스트 삭제	/admin/auth/%s/users	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255844494	1678255242692	getAuthMenuList	해당 권한의 메뉴 리스트 조회	/admin/auth/%s/menu	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255916716	1678255242692	deleteAuthMenuList	해당 권한의 메뉴 리스트 삭제	/admin/auth/%s/menu	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678259693318	1678257466870	getCodegroupList	코드 페이징 리스트 조회	/admin/codegroupPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255437541	1678255242692	setAuthDetail	권한 등록	/admin/auth	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255616749	1678255242692	setAuthUsers	해당 권한 사용이 가능한 사용자 리스트 등록	/admin/auth/%s/users	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260387549	1678260074028	getNoticeAttachFiles	공지사항 첨부파일 리스트 조회	/admin/notice/%s/attachFiles	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1680153561296	1680151086561	getDownloadFile	첨부파일 다운로드	/admin/downloadFile	GET	Y	2023-03-30 00:00:00	system	시스템	\N	\N	\N
1698026982630	1698026390160	getDataMapListByDataUri	유형 모델별 메타데이터 셋 목록 조회	/meta/api/v1/resource/%s	GET	Y	2023-10-23 11:12:43	system	시스템	\N	\N	\N
1698213640616	1698213521356	getLogList	메타데이터 수집 로그 목록 조회	/meta/api/v1/collection/logs	GET	Y	2023-10-25 15:00:41	system	시스템	\N	\N	\N
1678260408284	1678260074028	setNoticeAttachFiles	공지사항 첨부파일 리스트 등록	/admin/notice/%s/attachFiles	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260428132	1678260074028	deleteNoticeAttachFiles	공지사항 첨부파일 리스트 삭제	/admin/notice/%s/attachFiles	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260478328	1678260449549	getBoardPaging	게시판 페이징 리스트 조회	/admin/boardPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260495559	1678260449549	setBoardDetail	게시판 등록	/admin/board	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260511600	1678260449549	getBoardDetail	게시판 상세 조회	/admin/board/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260531779	1678260449549	modifyBoardDetail	게시판 수정	/admin/board/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260547591	1678260449549	deleteBoardDetail	게시판 삭제	/admin/board/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260626647	1678260568838	getboardmsgPaging	게시글 페이징 리스트 조회	/admin/boardPostPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260648722	1678260568838	setBoardmsgDetail	게시글 등록	/admin/board/%s/post	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260665209	1678260568838	getBoardmsgDetail	게시글 상세 조회	/admin/board/%s/post/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260680360	1678260568838	modifyBoardmsgDetail	게시글 수정	/admin/board/%s/post/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260697377	1678260568838	deleteBoardmsgDetail	게시글 삭제	/admin/board/%s/post/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260716368	1678260568838	getBoardmsgAttachFiles	게시글 첨부파일 리스트 조회	/admin/board/%s/post/%s/attachFiles	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260733458	1678260568838	setBoardmsgAttachFiles	게시글 첨부파일 리스트 등록	/admin/board/%s/post/%s/attachFiles	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260757916	1678260568838	getBoardmsgComments	게시글 댓글 리스트 조회	/admin/board/%s/post/%s/comments	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260776951	1678260568838	setBoardmsgComments	게시글 댓글 등록	/admin/board/%s/post/%s/comments	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260801700	1678260568838	modifyBoardmsgComments	게시글 댓글 수정	/admin/board/%s/post/%s/comments/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260841831	1678260568838	deleteBoardmsgComments	게시글 댓글 삭제	/admin/board/%s/post/%s/comments/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260925459	1678260904747	getFaqListPaging	FAQ 페이징 리스트 조회	/admin/faqPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260944088	1678260904747	getFaqDetail	FAQ 상세 조회	/admin/faq/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260965256	1678260904747	getFaqAttachFileList	FAQ 첨부파일 리스트 조회	/admin/faq/%s/attachFiles	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261108839	1678261033803	modifyQnaDetail	QNA 수정	/admin/qna/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261124551	1678261033803	deleteQnaDetail	QNA 삭제	/admin/qna/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261170615	1678261146503	getImageListPaging	이미지 페이징 리스트 조회	/admin/imgPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260981560	1678260904747	setFaqDetail	FAQ 등록	/admin/faq	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260997288	1678260904747	modifyFaqDetail	FAQ 수정	/admin/faq/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261011911	1678260904747	deleteFaqDetail	FAQ 삭제	/admin/faq/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261053897	1678261033803	getQnaListPaging	QNA 페이징 리스트 조회	/admin/qnaPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261074919	1678261033803	getQnaDetail	QNA 상세 조회	/admin/qna/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261093736	1678261033803	getQnaAttachFileList	게시글 첨부파일 리스트 조회	/admin/qna/%s/attachFiles	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261187095	1678261146503	getImageDetail	이미지 상세 조회	/admin/img/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261266745	1678261146503	setImageDetail	이미지 등록	/admin/img	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261292964	1678261146503	modifyImageDetail	이미지 수정	/admin/img/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261627948	1678261146503	deleteImageDetail	이미지 삭제	/admin/img/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261818644	1678261700799	getServiceNotification	서비스 구독 정보 조회	/iot/services/%s/subscriptions/urls	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261839331	1678261700799	setServiceDetail	서비스 등록	/iot/services	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261857149	1678261700799	modifyServiceDetail	서비스 수정	/iot/services/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261887113	1678261700799	deleteServiceDetail	서비스 삭제	/iot/services/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678262010775	1678261963107	getApigroupDetail	API 그룹 상세 조회	/admin/apigroup/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678262105051	1678261963107	deleteApigroupDetail	API 그룹 삭제	/admin/apigroup/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678262132107	1678261963107	getApiPagingList	API 페이징 리스트 조회	/admin/apigroup/%s/apiPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678262149123	1678261963107	getApiDetail	API 상세 조회	/admin/apigroup/%s/api/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678262167563	1678261963107	setApiDetail	API 등록	/admin/apigroup/%s/api	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678262201907	1678261963107	modifyApiDetail	API 수정	/admin/apigroup/%s/api/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678262218108	1678261963107	deleteApiDetail	API 삭제	/admin/apigroup/%s/api/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261227124	1678261146503	getImageAttachFileList	이미지 첨부파일 리스트 조회	/admin/img/%s/attachFiles	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261758795	1678261700799	getServiceListPaging	서비스 페이징 리스트 조회	/iot/services	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261787203	1678261700799	getServiceDetail	서비스 상세 조회	/iot/services/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678261991083	1678261963107	getApigroupListPaging	API 그룹 페이징 리스트 조회	/admin/apigroupPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678262027617	1678261963107	setApigroupDetail	API 그룹 등록	/admin/apigroup	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678262090488	1678261963107	modifyApigroupDetail	API 그룹 수정	/admin/apigroup/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678255560378	1678255242692	getAuthUserList	해당 권한 사용이 가능한 사용자 리스트 조회	/admin/auth/%s/users	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1682057906349	1682052959775	getMetaCodegroupList	메타데이터 코드 그룹 목록 조회	/meta/api/v1/portal/codegroups	GET	Y	2023-04-21 15:18:26	system	시스템	\N	\N	\N
1682058041966	1682052959775	getMetaCodegroup	메타데이터 코드 그룹 조회	/meta/api/v1/portal/codegroups/%s	GET	Y	2023-04-21 15:20:42	system	시스템	\N	\N	\N
1682058226855	1682052959775	getMetaCode	메타데이터 코드 조회	/meta/api/v1/portal/codegroups/%s/codes/%s	GET	Y	2023-04-21 15:23:47	system	시스템	\N	\N	\N
1682058243493	1682052959775	createMetaCode	메타데이터 코드 생성	/meta/api/v1/portal/codegroups/%s/codes	POST	Y	2023-04-21 15:24:03	system	시스템	\N	\N	\N
1682058255393	1682052959775	modifyMetaCode	메타데이터 코드 수정	/meta/api/v1/portal/codegroups/%s/codes/%s	PUT	Y	2023-04-21 15:24:15	system	시스템	\N	\N	\N
1682058138771	1682052959775	createMetaCodegroup	메타데이터 코드 그룹 생성	/meta/api/v1/portal/codegroups	POST	Y	2023-04-21 15:22:19	system	시스템	\N	\N	\N
1682058177356	1682052959775	modifyMetaCodegroup	메타데이터 코드 그룹 수정	/meta/api/v1/portal/codegroups/%s	PUT	Y	2023-04-21 15:22:57	system	시스템	\N	\N	\N
1682058216292	1682052959775	getMetaCodeList	메타데이터 코드 목록 조회	/meta/api/v1/portal/codegroups/%s/codes	GET	Y	2023-04-21 15:23:36	system	시스템	\N	\N	\N
1683086865637	1683086628995	getCategoryList	카테고리 페이징 목록 조회	/meta/api/v1/resource/categories	GET	Y	2023-05-03 13:07:46	system	시스템	\N	\N	\N
1683086997813	1683086628995	getCategory	카테고리 상세 조회	/meta/api/v1/resource/categories/%s	GET	Y	2023-05-03 13:09:58	system	시스템	\N	\N	\N
1683087129496	1683086628995	createCategory	카테고리 등록	/meta/api/v1/resource/categories	POST	Y	2023-05-03 13:12:10	system	시스템	\N	\N	\N
1683087238740	1683086628995	modifyCategory	카테고리 수정	/meta/api/v1/resource/categories/%s	PUT	Y	2023-05-03 13:13:59	system	시스템	\N	\N	\N
1683087297582	1683086628995	deleteCategory	카테고리 삭제	/meta/api/v1/resource/categories/%s	DELETE	Y	2023-05-03 13:14:58	system	시스템	\N	\N	\N
1701824051008	1701393170121	getElasticDataListWithJson	ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색)	/meta/api/v1/search/elastic/data/json	GET	Y	2023-12-06 09:54:11	system	시스템	\N	\N	\N
1708490069546	1708490013806	getIdSchemeStdIndCodeList	표준산업분류체계 코드 목록 조회	/meta/api/v1/schema/ksiccodes	GET	Y	2024-02-21 13:34:30	system	시스템	\N	\N	\N
1707187204707	1707187116687	getPatList	내 PAT 목록 조회	/meta/api/v1/portal/mypage/pats	GET	Y	2024-02-06 11:40:05	system	시스템	\N	\N	\N
1683181763737	1683181683641	getCountryCodeList	국가코드 목록 조회	/meta/api/v1/portal/countrycodes	GET	Y	2023-05-04 15:29:24	system	시스템	\N	\N	\N
1684137737246	1684137482763	getNamespaceList	네임스페이스 목록 조회 (페이징 x)	/meta/api/v1/rdf/namespaces	GET	Y	2023-05-15 17:02:17	system	시스템	\N	\N	\N
1684137808102	1684137482763	getNamespace	네임스페이스 상세 조회	/meta/api/v1/rdf/namespaces/%s	GET	Y	2023-05-15 17:03:28	system	시스템	\N	\N	\N
1684137869530	1684137482763	createNamespace	네임스페이스 등록	/meta/api/v1/rdf/namespaces	POST	Y	2023-05-15 17:04:30	system	시스템	\N	\N	\N
1684137989984	1684137482763	deleteNamespace	네임스페이스 삭제	/meta/api/v1/rdf/namespaces/%s	DELETE	Y	2023-05-15 17:06:30	system	시스템	\N	\N	\N
1684137921282	1684137482763	modifyNamespace	네임스페이스 수정	/meta/api/v1/rdf/namespaces/%s	PUT	Y	2023-05-15 17:05:21	system	시스템	\N	\N	\N
1684374557079	1684374309665	getMetadataSetList	메타데이터 셋 목록 조회 (화면용)	/meta/api/v1/resource/metadatasets	GET	Y	2023-05-18 10:49:17	system	시스템	\N	\N	\N
1684374621253	1684374309665	getMetadataSet	메타데이터 셋 목록 조회 (화면용)	/meta/api/v1/resource/metadatasets/%s	GET	Y	2023-05-18 10:50:21	system	시스템	\N	\N	\N
1684457165276	1684374309665	createMetadataSet	메타데이터 셋 생성	/meta/api/v1/resource/metadatasets	POST	Y	2023-05-19 09:46:05	system	시스템	\N	\N	\N
1684482382251	1684374309665	modifyMetadataSet	메타데이터 셋 수정	/meta/api/v1/resource/metadatasets/%s	PUT	Y	2023-05-19 16:46:22	system	시스템	\N	\N	\N
1684483387053	1684374309665	modifyMetadataSetStatus	메타데이터 셋 상태 변경	/meta/api/v1/resource/metadatasets/%s	PATCH	Y	2023-05-19 17:03:07	system	시스템	\N	\N	\N
1684485637051	1684374309665	getMetadatasetListForSave	저장을 위한 메타데이터 목록 조회 (배열 property 아닌 것만 조회)	/meta/api/v1/resource/metadatasets/%s/properties-for-save	GET	Y	2023-05-19 17:40:37	system	시스템	\N	\N	\N
1684720536372	1684374309665	getModelInfoBySetId	메타데이터 셋의 모델 정보 조회	/meta/api/v1/resource/metadatasets/%s/modelinfo	GET	Y	2023-05-22 10:55:36	system	시스템	\N	\N	\N
1684720640448	1684374309665	getMetadataListBySetPropertyNm	메타데이터 셋의 프라퍼티 조회	/meta/api/v1/resource/metadatasets/%s/properties/%s	GET	Y	2023-05-22 10:57:20	system	시스템	\N	\N	\N
1684820881644	1684374309665	getMetadataList	메타데이터 목록 조회	/meta/api/v1/resource/metadata	GET	Y	2023-05-23 14:48:02	system	시스템	\N	\N	\N
1685424829252	1684374309665	deleteMetadata	메타데이터 삭제	/meta/api/v1/resource/metadata/%s	DELETE	Y	2023-05-30 14:33:49	system	시스템	\N	\N	\N
1685434450761	1684374309665	getMetadata	메타데이터 조회	/meta/api/v1/resource/metadata/%s	GET	Y	2023-05-30 17:14:11	system	시스템	\N	\N	\N
1686097847986	1684374309665	getMetadataSetDtwListBySubSetId	메타데이터 셋 ID로 연결된 상위 디지털트윈 메타데이터 셋 목록 조회	/meta/api/v1/resource/metadatasets/%s/top-dts	GET	Y	2023-06-07 09:30:48	system	시스템	\N	\N	\N
1687323422215	1684137482763	checkNamespaceUri	네임스페이스 URI 중복체크	/meta/api/v1/rdf/namespaces/checkUri	GET	Y	2023-06-21 13:57:02	system	시스템	\N	\N	\N
1708493218509	1708490013806	getIdSchemeStdIndLctgCodeList	표준산업분류체계 코드 대분류 외부 코드 목록 조회	/meta/api/v1/schema/ksiccodes/lctgcodes	GET	Y	2024-02-21 14:26:59	system	시스템	\N	\N	\N
1687323455507	1684137482763	checkNamespacePrefix	네임스페이스 prefix 중복 체크	/meta/api/v1/rdf/namespaces/checkPrefix	GET	Y	2023-06-21 13:57:36	system	시스템	\N	\N	\N
1688005282398	1683181683641	createCountryCode	국가코드 생성	/meta/api/v1/portal/countrycodes	POST	Y	2023-06-29 11:21:22	system	시스템	\N	\N	\N
1688005225256	1683181683641	getCountryCode	국가코드 조회	/meta/api/v1/portal/countrycodes/%s	GET	Y	2023-06-29 11:20:25	system	시스템	\N	\N	\N
1688005351511	1683181683641	modifyCountryCode	국가코드 수정	/meta/api/v1/portal/countrycodes/%s	PUT	Y	2023-06-29 11:22:32	system	시스템	\N	\N	\N
1692326701957	1692326675810	getNotificationTypeList	알림 유형 목록 조회	/meta/api/v1/portal/notifictypes	GET	Y	2023-08-18 11:45:02	system	시스템	\N	\N	\N
1692326718055	1692326675810	getNotificationType	알림 유형 조회	/meta/api/v1/portal/notifictypes/%s	GET	Y	2023-08-18 11:45:18	system	시스템	\N	\N	\N
1692326743385	1692326675810	isNotifcTypeIdDuplicated	알림 유형 중복체크	/meta/api/v1/portal/notifictypes/check	GET	Y	2023-08-18 11:45:43	system	시스템	\N	\N	\N
1692326765266	1692326675810	createNotifcType	알림 유형 등록	/meta/api/v1/portal/notifictypes	POST	Y	2023-08-18 11:46:05	system	시스템	\N	\N	\N
1684476985993	1684374309665	deleteMetadataSetAndMetadata	메타데이터셋 및 하위 메타데이터 삭제	/meta/api/v1/resource/metadatasets/%s	DELETE	Y	2023-05-19 15:16:26	system	시스템	\N	\N	\N
1701405118409	1701393170121	saveElasticData	셋 ID 로 ElasticSearch에 메타데이터 셋 정보 등록/수정	/meta/api/v1/search/elastic/data/%s	PUT	Y	2023-12-01 13:31:58	system	시스템	\N	\N	\N
1701406278717	1701393170121	deleteElasticData	셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 삭제	/meta/api/v1/search/elastic/data/%s	DELETE	Y	2023-12-01 13:51:19	system	시스템	\N	\N	\N
1707197515789	1707187116687	getPat	내 PAT 상세 조회	/meta/api/v1/portal/pats/%s	GET	Y	2024-02-06 14:31:56	system	시스템	\N	\N	\N
1701393235584	1701393170121	getElasticData	셋 ID 로 ElasticSearch에 저장된 메타데이터 셋 조회	/meta/api/v1/search/elastic/data/%s	GET	Y	2023-12-01 10:13:56	system	시스템	\N	\N	\N
1701653073570	1701393170121	getElasticDataList	ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (내용, 날짜만 검색)	/meta/api/v1/search/elastic/data	GET	Y	2023-12-04 10:24:34	system	시스템	\N	\N	\N
1707199779260	1707187116687	deletePat	내 PAT 삭제	/meta/api/v1/portal/pats/%s	DELETE	Y	2024-02-06 15:09:39	system	시스템	\N	\N	\N
1707207142550	1707187116687	createPat	내 PAT 등록	/meta/api/v1/portal/pats	POST	Y	2024-02-06 17:12:23	system	시스템	\N	\N	\N
1692326779519	1692326675810	modifyNotifcType	알림 유형 수정	/meta/api/v1/portal/notifictypes/%s	PUT	Y	2023-08-18 11:46:20	system	시스템	\N	\N	\N
1692326796871	1692326675810	deleteNotifcType	알림 유형 삭제	/meta/api/v1/portal/notifictypes/%s	DELETE	Y	2023-08-18 11:46:37	system	시스템	\N	\N	\N
1692326842025	1692326675810	getNotificationTarget	알림 대상 조회	/meta/api/v1/portal/notifictargets/%s	GET	Y	2023-08-18 11:47:22	system	시스템	\N	\N	\N
1692326883444	1692326675810	modifyNotificationTarget	알림 대상 수정	/meta/api/v1/portal/notifictargets/%s	PUT	Y	2023-08-18 11:48:03	system	시스템	\N	\N	\N
1692326898763	1692326675810	deleteNotificationTarget	알림 대상 삭제	/meta/api/v1/portal/notifictargets/%s	DELETE	Y	2023-08-18 11:48:19	system	시스템	\N	\N	\N
1692326858753	1692326675810	createNotificationTarget	알림 대상 등록	/meta/api/v1/portal/notifictargets	POST	Y	2023-08-18 11:47:39	system	시스템	\N	\N	\N
1692331576067	1684374309665	getMetadataSetChgHstListBySetId	메타데이터 셋 ID로 메타데이터 셋 변경 이력 목록 조회	/meta/api/v1/resource/metadatasets/%s/histories	GET	Y	2023-08-18 13:06:16	system	시스템	\N	\N	\N
1692331676009	1692331647806	getClassList	클래스 목록 조회	/meta/api/v1/rdf/classes	GET	Y	2023-08-18 13:07:56	system	시스템	\N	\N	\N
1692331692455	1692331647806	getClass	클래스 조회	/meta/api/v1/rdf/classes/%s	GET	Y	2023-08-18 13:08:12	system	시스템	\N	\N	\N
1692331709628	1692331647806	createClass	클래스 등록	/meta/api/v1/rdf/classes	POST	Y	2023-08-18 13:08:30	system	시스템	\N	\N	\N
1692331724503	1692331647806	modifyClass	클래스 수정	/meta/api/v1/rdf/classes/%s	PUT	Y	2023-08-18 13:08:45	system	시스템	\N	\N	\N
1692331738243	1692331647806	deleteClass	클래스 삭제	/meta/api/v1/rdf/classes/%s	DELETE	Y	2023-08-18 13:08:58	system	시스템	\N	\N	\N
1692331775779	1692331647806	getPropertyListByRdfClass	클래스의 프라퍼티 목록 조회	/meta/api/v1/rdf/classes/%s/properties	GET	Y	2023-08-18 13:09:36	system	시스템	\N	\N	\N
1692332696460	1692332647322	getPropertyList	프라퍼티 목록 조회	/meta/api/v1/rdf/properties	GET	Y	2023-08-18 13:24:56	system	시스템	\N	\N	\N
1692332713039	1692332647322	getProperty	프라퍼티 조회	/meta/api/v1/rdf/properties/%s	GET	Y	2023-08-18 13:25:13	system	시스템	\N	\N	\N
1692332755756	1692332647322	createProperty	프라퍼티 등록	/meta/api/v1/rdf/properties	POST	Y	2023-08-18 13:25:56	system	시스템	\N	\N	\N
1692332775974	1692332647322	modifyProperty	프라피터 수정	/meta/api/v1/rdf/properties/%s	PUT	Y	2023-08-18 13:26:16	system	시스템	\N	\N	\N
1692332792679	1692332647322	deleteProperty	프라퍼티 삭제	/meta/api/v1/rdf/properties/%s	DELETE	Y	2023-08-18 13:26:33	system	시스템	\N	\N	\N
1692332894088	1692332647322	getPropertyDefineList	프라퍼티 정의 목록	/meta/api/v1/rdf/propertydefines	GET	Y	2023-08-18 13:28:14	system	시스템	\N	\N	\N
1692332929175	1692332647322	createPropertyDefineList	프라퍼티 정의 등록 (Multi)	/meta/api/v1/rdf/propertydefines	POST	Y	2023-08-18 13:28:49	system	시스템	\N	\N	\N
1692332951616	1692332647322	deletePropertyDefineList	프라퍼티 정의 삭제 (Multi)	/meta/api/v1/rdf/propertydefines	DELETE	Y	2023-08-18 13:29:12	system	시스템	\N	\N	\N
1692333044557	1692332995430	getMappingList	매핑 목록 조회	/meta/api/v1/rdf/mappings	GET	Y	2023-08-18 13:30:45	system	시스템	\N	\N	\N
1692333060316	1692332995430	getMapping	매핑 조회	/meta/api/v1/rdf/mappings/%s	GET	Y	2023-08-18 13:31:00	system	시스템	\N	\N	\N
1692333072208	1692332995430	createMapping	매핑 등록	/meta/api/v1/rdf/mappings	POST	Y	2023-08-18 13:31:12	system	시스템	\N	\N	\N
1692333085219	1692332995430	modifyMapping	매핑 수정	/meta/api/v1/rdf/mappings/%s	PUT	Y	2023-08-18 13:31:25	system	시스템	\N	\N	\N
1692333098810	1692332995430	deleteMapping	매핑 삭제	/meta/api/v1/rdf/mappings/%s	DELETE	Y	2023-08-18 13:31:39	system	시스템	\N	\N	\N
1692333167143	1692332995430	getMappingModelList	매핑 모델 목록 조회	/meta/api/v1/rdf/mappingmodels	GET	Y	2023-08-18 13:32:47	system	시스템	\N	\N	\N
1692333200146	1692332995430	createMappingModel	매핑 모델 등록	/meta/api/v1/rdf/mappingmodels	POST	Y	2023-08-18 13:33:20	system	시스템	\N	\N	\N
1692333220159	1692332995430	modifyMappingModel	매핑 모델 수정	/meta/api/v1/rdf/mappingmodels/%s	PUT	Y	2023-08-18 13:33:40	system	시스템	\N	\N	\N
1692333237529	1692332995430	deleteMappingModel	매핑 모델 삭제	/meta/api/v1/rdf/mappingmodels/%s	DELETE	Y	2023-08-18 13:33:58	system	시스템	\N	\N	\N
1692333291668	1692332995430	getMappingTreeList	매핑 모델 트리 목록 조회	/meta/api/v1/rdf/mappingmodels/%s/tree	GET	Y	2023-08-18 13:34:52	system	시스템	\N	\N	\N
1692333338247	1692332995430	getMappingruleList	매핑 규칙 조회	/meta/api/v1/rdf/mappingrules	GET	Y	2023-08-18 13:35:38	system	시스템	\N	\N	\N
1692333358028	1692332995430	createMappingrule	매핑 규칙 등록	/meta/api/v1/rdf/mappingrules	POST	Y	2023-08-18 13:35:58	system	시스템	\N	\N	\N
1692333376366	1692332995430	modifyMappingrule	매핑 규칙 수정	/meta/api/v1/rdf/mappingrules/%s	PUT	Y	2023-08-18 13:36:16	system	시스템	\N	\N	\N
1692333393669	1692332995430	deleteMappingrule	매핑 규칙 삭제	/meta/api/v1/rdf/mappingrules/%s	DELETE	Y	2023-08-18 13:36:34	system	시스템	\N	\N	\N
1692333983295	1692333947468	getDataTypeModelList	DataType 모델 목록 조회	/meta/api/v1/schema/datatypes	GET	Y	2023-08-18 13:46:23	system	시스템	\N	\N	\N
1692334010164	1692333947468	createDataTypeModel	DataType 모델 등록	/meta/api/v1/schema/datatypes	POST	Y	2023-08-18 13:46:50	system	시스템	\N	\N	\N
1692334030018	1692333947468	modifyDataTypeModel	DataType 모델 수정	/meta/api/v1/schema/datatypes/%s	PUT	Y	2023-08-18 13:47:10	system	시스템	\N	\N	\N
1692334048039	1692333947468	deleteDataTypeModel	DataType 모델 삭제	/meta/api/v1/schema/datatypes/%s	DELETE	Y	2023-08-18 13:47:28	system	시스템	\N	\N	\N
1708576054874	1708490013806	createKsicCode	표준산업분류체계 코드 등록	/meta/api/v1/schema/ksiccodes	POST	Y	2024-02-22 13:27:35	system	시스템	\N	\N	\N
1692326826188	1692326675810	getNotificationTargetList	알림 대상 목록 조회	/meta/api/v1/portal/notifictargets	GET	Y	2023-08-18 11:47:06	system	시스템	\N	\N	\N
1692334305091	1692334188123	getModelCheck	메타데이터 모델 중복체크	/meta/api/v1/schema/models/check	GET	Y	2023-08-18 13:51:45	system	시스템	\N	\N	\N
1692334320984	1692334188123	getModel	메타데이터 모델 조회	/meta/api/v1/schema/models/%s	GET	Y	2023-08-18 13:52:01	system	시스템	\N	\N	\N
1692334361669	1692334188123	getMetaDataModelList	메타데이터 모델 목록 조회	/meta/api/v1/schema/models	GET	Y	2023-08-18 13:52:42	system	시스템	\N	\N	\N
1692334416288	1692334188123	getModelPropertyList	메타데이터 모델 프라퍼티 목록 조회	/meta/api/v1/schema/models/%s/properties	GET	Y	2023-08-18 13:53:36	system	시스템	\N	\N	\N
1692334472761	1692334188123	getRdfStr	메타데이터 모델을 RDF 모델로 변환된 문자열 조회 (RDF 확인)	/meta/api/v1/schema/models/%s/rdf	GET	Y	2023-08-18 13:54:33	system	시스템	\N	\N	\N
1692334541153	1692334515538	getPropertyList	메타데이터 프라퍼티 목록 조회	/meta/api/v1/schema/properties	GET	Y	2023-08-18 13:55:41	system	시스템	\N	\N	\N
1692334556278	1692334515538	getProperty	메타데이터 프라퍼티 조회	/meta/api/v1/schema/properties/%s	GET	Y	2023-08-18 13:55:56	system	시스템	\N	\N	\N
1692334588630	1692334515538	modifyProperty	메타데이터 프라퍼티 수정	/meta/api/v1/schema/properties/%s/base	PUT	Y	2023-08-18 13:56:29	system	시스템	\N	\N	\N
1692334629646	1692334515538	modifyPropertyDef	메타데이터 프라퍼티 정의 변경	/meta/api/v1/schema/properties/%s/define	PUT	Y	2023-08-18 13:57:10	system	시스템	\N	\N	\N
1692334654109	1692334515538	getPropertyCheck	메타데이터 프라퍼티 중복체크	/meta/api/v1/schema/properties/check	GET	Y	2023-08-18 13:57:34	system	시스템	\N	\N	\N
1692334679673	1692334515538	getTypePropertyList	메타데이터 유형 프라퍼티 목록 조회	/meta/api/v1/schema/typeproperties/%s	GET	Y	2023-08-18 13:58:00	system	시스템	\N	\N	\N
1692334760964	1692334729497	getTypeModelList	유형 모델 목록 조회	/meta/api/v1/schema/typemodels	GET	Y	2023-08-18 13:59:21	system	시스템	\N	\N	\N
1692334776810	1692334729497	createTypeModel	유형 모델 등록	/meta/api/v1/schema/typemodels	POST	Y	2023-08-18 13:59:37	system	시스템	\N	\N	\N
1692334796669	1692334729497	modifyTypeModel	유형 모델 수정	/meta/api/v1/schema/typemodels/%s	PUT	Y	2023-08-18 13:59:57	system	시스템	\N	\N	\N
1692334816154	1692334729497	deleteTypeModel	유형 모델 삭제	/meta/api/v1/schema/typemodels/%s	DELETE	Y	2023-08-18 14:00:16	system	시스템	\N	\N	\N
1692334904492	1692334854665	getTypeModelPropertyList	메타데이터 유형 모델 프라퍼티 목록 조회	/meta/api/v1/schema/typemodels/%s/properties	GET	Y	2023-08-18 14:01:44	system	시스템	\N	\N	\N
1692334928259	1692334854665	modifyModelProperty	메타데이터 유형 모델 프라퍼티 수정 (Multi)	/meta/api/v1/schema/typemodels/%s/properties	PUT	Y	2023-08-18 14:02:08	system	시스템	\N	\N	\N
1692334946774	1692334854665	createModelProperty	메타데이터 유형 모델 프라퍼티 등록 (Multi)	/meta/api/v1/schema/typemodels/%s/properties	POST	Y	2023-08-18 14:02:27	system	시스템	\N	\N	\N
1692334970819	1692334854665	deleteModelProperty	메타데이터 유형 모델 프라퍼티 삭제 (Multi)	/meta/api/v1/schema/typemodels/%s/properties	DELETE	Y	2023-08-18 14:02:51	system	시스템	\N	\N	\N
1692335255693	1692335211578	createStdModel	표준 모델 등록	/meta/api/v1/schema/stdmodels	POST	Y	2023-08-18 14:07:36	system	시스템	\N	\N	\N
1692335337426	1692335211578	modifyStdModel	표준 모델 수정	/meta/api/v1/schema/stdmodels/%s	PUT	Y	2023-08-18 14:08:57	system	시스템	\N	\N	\N
1692335354964	1692335211578	deleteStdModel	표준 모델 삭제	/meta/api/v1/schema/stdmodels/%s	DELETE	Y	2023-08-18 14:09:15	system	시스템	\N	\N	\N
1692335394282	1692335211578	getStdModelPropertyList	메타데이터 표준 모델 프라퍼티 목록	/meta/api/v1/schema/stdmodels/%s/properties	GET	Y	2023-08-18 14:09:54	system	시스템	\N	\N	\N
1692335421835	1692335211578	createStdModelProperty	메타데이터 표준 모델 프라퍼티 등록 (Multi)	/meta/api/v1/schema/stdmodels/%s/properties	POST	Y	2023-08-18 14:10:22	system	시스템	\N	\N	\N
1692333540001	1692333540000	getUserPaging	사용자 페이징 리스트 조회	/admin/userPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333550002	1692333550000	getAuthDetail	권한 상세 조회	/admin/auth/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333550003	1692333550000	setAuthDetail	권한 등록	/admin/auth	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333550004	1692333550000	modifyAuthDetail	권한 수정	/admin/auth/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333550005	1692333550000	deleteAuthDetail	권한 삭제	/admin/auth/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333550006	1692333550000	getAuthUserList	해당 권한 사용이 가능한 사용자 리스트 조회	/admin/auth/%s/users	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333550007	1692333550000	setAuthUsers	해당 권한 사용이 가능한 사용자 리스트 등록	/admin/auth/%s/users	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333550008	1692333550000	deleteAuthUsers	해당 권한 사용이 가능한 사용자 리스트 삭제	/admin/auth/%s/users	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333550009	1692333550000	getAuthMenuList	해당 권한의 메뉴 리스트 조회	/admin/auth/%s/menu	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333550010	1692333550000	setAuthMenus	해당 권한의 메뉴 리스트 등록	/admin/auth/%s/menus	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333550011	1692333550000	deleteAuthMenuList	해당 권한의 메뉴 리스트 삭제	/admin/auth/%s/menu	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333560001	1692333560000	getUserMenu	user 권한에 근거하여 메뉴 리스트 조회	/admin/usermenu	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333560002	1692333560000	getMenuList	메뉴 전체 리스트 조회	/admin/menu	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333560003	1692333560000	setMenuDetail	메뉴 등록	/admin/menu	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333560004	1692333560000	getMenuDetail	메뉴 상세 조회	/admin/menu/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333560005	1692333560000	modifyMenuDetail	메뉴 수정	/admin/menu/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333560006	1692333560000	deleteMenuDetail	메뉴 삭제	/admin/menu/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692334571431	1692334515538	createProperty	메타데이터 프라퍼티 등록	/meta/api/v1/schema/properties	POST	Y	2023-08-18 13:56:11	system	시스템	\N	\N	\N
1692333570001	1692333570000	getApigroupListPaging	API 그룹 페이징 리스트 조회	/admin/apigroupPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333570002	1692333570000	getApigroupDetail	API 그룹 상세 조회	/admin/apigroup/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333570003	1692333570000	setApigroupDetail	API 그룹 등록	/admin/apigroup	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333570004	1692333570000	modifyApigroupDetail	API 그룹 수정	/admin/apigroup/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333570005	1692333570000	deleteApigroupDetail	API 그룹 삭제	/admin/apigroup/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333570006	1692333570000	getApiPagingList	API 페이징 리스트 조회	/admin/apigroup/%s/apiPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333570007	1692333570000	getApiDetail	API 상세 조회	/admin/apigroup/%s/api/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333570008	1692333570000	setApiDetail	API 등록	/admin/apigroup/%s/api	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333570009	1692333570000	modifyApiDetail	API 수정	/admin/apigroup/%s/api/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333550001	1692333550000	getAuthListByPaging	권한 목록 조회(페이징 처리)	/admin/authPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260100008	1678260100000	deleteNoticeAttachFiles	공지사항 첨부파일 리스트 삭제	/admin/notice/%s/attachFiles	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260110001	1678260110000	getFaqListPaging	FAQ 페이징 리스트 조회	/admin/faqPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260110002	1678260110000	getFaqDetail	FAQ 상세 조회	/admin/faq/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260110003	1678260110000	getFaqAttachFileList	FAQ 첨부파일 리스트 조회	/admin/faq/%s/attachFiles	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260110004	1678260110000	setFaqDetail	FAQ 등록	/admin/faq	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260110005	1678260110000	modifyFaqDetail	FAQ 수정	/admin/faq/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260110006	1678260110000	deleteFaqDetail	FAQ 삭제	/admin/faq/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260120001	1678260120000	getQnaListPaging	QNA 페이징 리스트 조회	/admin/qnaPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260120002	1678260120000	getQnaDetail	QNA 상세 조회	/admin/qna/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260120003	1678260120000	getQnaAttachFileList	게시글 첨부파일 리스트 조회	/admin/qna/%s/attachFiles	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260120006	1678260120000	deleteQnaDetail	QNA 삭제	/admin/qna/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260120005	1678260120000	modifyQnaDetail	QNA 수정	/admin/qna/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1682578841474	1682577494093	createAgent	대리인 등록	/meta/api/v1/resource/agents	POST	Y	2023-04-27 16:00:41	system	시스템	\N	\N	\N
1682578911035	1682577494093	modifyAgent	대리인 수정	/meta/api/v1/resource/agents/%s	PUT	Y	2023-04-27 16:01:51	system	시스템	\N	\N	\N
1696922887235	1696922694251	saveNeo4jRdbMetadataSet	셋 ID 로 NEO4J 그래프에 메타데이터 저장 - upsert (RDB)	/meta/api/v1/rdf/graph/neo4j/origindata/%s	PUT	Y	2023-10-10 16:28:07	system	시스템	\N	\N	\N
1696923734961	1696913843077	saveToGraphForUse	셋 ID 로 그래프에 메터데이터 저장 - upsert	/meta/api/v1/rdf/graph/virtuoso/data/%s	PUT	Y	2023-10-10 16:42:15	system	시스템	\N	\N	\N
1696923782023	1696913843077	deleteFromGraphForUse	셋 ID 로 그래프에서 메타데이터 삭제	/meta/api/v1/rdf/graph/virtuoso/data/%s	DELETE	Y	2023-10-10 16:43:02	system	시스템	\N	\N	\N
1696923818979	1696913843077	saveToGraphForDev	셋 ID 로 그래프에 메터데이터 저장 (dev)	/meta/api/v1/rdf/graph/virtuoso/data/%s/dev	PUT	Y	2023-10-10 16:43:39	system	시스템	\N	\N	\N
1696923850537	1696913843077	deleteFromGraphForDev	셋 ID 로 그래프에서 메타데이터 삭제 (dev)	/meta/api/v1/rdf/graph/virtuoso/data/%s/dev	DELETE	Y	2023-10-10 16:44:11	system	시스템	\N	\N	\N
1697001882572	1697001445182	modifyMyNotifcSetting	내 알림 설정 수정	/meta/api/v1/portal/mypage/notifcsettings/%s	PUT	Y	2023-10-11 14:24:43	system	시스템	\N	\N	\N
1696923096430	1696922694251	saveNeo4jMetadataSet	셋 ID 로 NEO4J 그래프에 메타데이터 저장 - upsert (RDF)	/meta/api/v1/rdf/graph/neo4j/data/%s	PUT	Y	2023-10-10 16:31:36	system	시스템	\N	\N	\N
1697002054445	1684374309665	getMyMetadataSetList	내 디지털트윈 목록	/meta/api/v1/portal/mypage/dts	GET	Y	2023-10-11 14:27:34	system	시스템	\N	\N	\N
1697001834044	1697001834043	getNoticePaging	공지사항 페이징 리스트 조회	/admin/noticePaging	GET	Y	2023-10-11 14:27:00	system	시스템	\N	\N	\N
1697093880341	1697090069772	getMetadataSetList	메타데이터 셋 목록 조회	/meta/api/v1/resource/metadatasets	GET	Y	2023-10-12 15:58:00	system	시스템	\N	\N	\N
1697093912570	1697090069772	getMetadataSet	메타데이터 셋 조회	/meta/api/v1/resource/metadatasets/%s	GET	Y	2023-10-12 15:58:33	system	시스템	\N	\N	\N
1682057906350	1697095431263	getMetaCodegroupList	메타데이터 코드 그룹 목록 조회	/meta/api/v1/portal/codegroups	GET	Y	2023-04-21 15:18:26	system	시스템	\N	\N	\N
1682058041967	1697095431263	getMetaCodegroup	메타데이터 코드 그룹 조회	/meta/api/v1/portal/codegroups/%s	GET	Y	2023-04-21 15:20:42	system	시스템	\N	\N	\N
1682058216293	1697095431263	getMetaCodeList	메타데이터 코드 목록 조회	/meta/api/v1/portal/codegroups/%s/codes	GET	Y	2023-04-21 15:23:36	system	시스템	\N	\N	\N
1682058226856	1697095431263	getMetaCode	메타데이터 코드 조회	/meta/api/v1/portal/codegroups/%s/codes/%s	GET	Y	2023-04-21 15:23:47	system	시스템	\N	\N	\N
1683181763738	1697095431263	getCountryCodeList	국가코드 목록 조회	/meta/api/v1/portal/countrycodes	GET	Y	2023-05-04 15:29:24	system	시스템	\N	\N	\N
1678259925840	1697095431263	getCodes	코드 리스트 조회	/admin/codegroup/%s/codes	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1697095748792	1697090069772	getMetaDataModelList	메타데이터 모델 목록 조회	/meta/api/v1/schema/models	GET	Y	2023-10-12 16:29:09	system	시스템	\N	\N	\N
1692333570010	1692333570000	deleteApiDetail	API 삭제	/admin/apigroup/%s/api/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333580001	1692333580000	getCodegroupList	코드 페이징 리스트 조회	/admin/codegroupPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333580002	1692333580000	setCodegroup	코드 그룹 등록	/admin/codegroup	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333580003	1692333580000	getCodegroupDetail	권한 그룹 상세 조회	/admin/codegroup/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333580004	1692333580000	modifyCodegroupDetail	코드 그룹 수정	/admin/codegroup/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333580005	1692333580000	deleteCodegroupDetail	코드 그룹 삭제	/admin/codegroup/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333580006	1692333580000	getCodes	코드 리스트 조회	/admin/codegroup/%s/codes	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333580007	1692333580000	setCode	코드 등록	/admin/codegroup/%s/codes	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333580008	1692333580000	modifyCode	코드 수정	/admin/codegroup/%s/codes/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1692333580009	1692333580000	deleteCode	코드 삭제	/admin/codegroup/%s/codes/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260100001	1678260100000	getNoticePaging	공지사항 페이징 리스트 조회	/admin/noticePaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260100002	1678260100000	getNoticeDetail	공지사항 상세 조회	/admin/notice/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260100003	1678260100000	setNoticeDetail	공지사항 등록	/admin/notice	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260100004	1678260100000	modifyNoticeDetail	공지사항 수정	/admin/notice/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260100005	1678260100000	deleteNoticeDetail	공지사항 삭제	/admin/notice/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260100006	1678260100000	getNoticeAttachFiles	공지사항 첨부파일 리스트 조회	/admin/notice/%s/attachFiles	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260100007	1678260100000	setNoticeAttachFiles	공지사항 첨부파일 리스트 등록	/admin/notice/%s/attachFiles	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1697095891903	1697090069772	getCategoryList	카테고리 페이징 목록 조회	/meta/api/v1/resource/categories	GET	Y	2023-10-12 16:31:32	system	시스템	\N	\N	\N
1697097401054	1697090069772	getStdModelPropertyList	메타데이터 표준 모델 프라퍼티 목록	/meta/api/v1/schema/stdmodels/%s/properties	GET	Y	2023-10-12 16:56:41	system	시스템	\N	\N	\N
1697097830156	1697097728017	getNeo4jRdbMedata	NEO4J 조회 (RDB)	/meta/api/v1/rdf/graph/neo4j/origindata	GET	Y	2023-10-12 17:03:50	system	시스템	\N	\N	\N
1697097924010	1697097728017	getNeo4jData	NEO4J 조회 (RDF)	/meta/api/v1/rdf/graph/neo4j/data	GET	Y	2023-10-12 17:05:24	system	시스템	\N	\N	\N
1697098016247	1697097728017	getNeo4jBrowserUrl	NEO4J Browser URL	/meta/api/v1/rdf/graph/neo4j/browser-url	GET	Y	2023-10-12 17:06:56	system	시스템	\N	\N	\N
1697099293728	1692333550000	createAuth	권한 생성	/admin/auth	POST	Y	2023-10-12 17:28:14	system	시스템	\N	\N	\N
1697099397955	1692333550000	removeAuthData	권한에 대한 모든 데이터 삭제	/admin/authData/%s	DELETE	Y	2023-10-12 17:29:58	system	시스템	\N	\N	\N
1697099487929	1692333550000	getSuperAdmin	슈퍼 관리자 조회	/admin/auth/admin	GET	Y	2023-10-12 17:31:28	system	시스템	\N	\N	\N
1697099584375	1692333550000	getAuthUser	권한 사용자 상세 조회	/admin/auth/%s/users/%s	GET	Y	2023-10-12 17:33:04	system	시스템	\N	\N	\N
1697099777487	1692333550000	removeAuthUsers	권한 사용자 삭제	/admin/auth/%s/users/%s	DELETE	Y	2023-10-12 17:36:17	system	시스템	\N	\N	\N
1697099853281	1692333550000	getAuthMenuList	권한 메뉴 조회	/admin/auth/%s/menu	GET	Y	2023-10-12 17:37:33	system	시스템	\N	\N	\N
1697099895169	1692333550000	getAuthMenu	권한 메뉴 상세 조회	/admin/auth/%s/menu/%s	GET	Y	2023-10-12 17:38:15	system	시스템	\N	\N	\N
1708584577888	1708490013806	modifyKsicCode	표준산업분류체계 코드 수정	/meta/api/v1/schema/ksiccodes/%s	PUT	Y	2024-02-22 15:49:38	system	시스템	\N	\N	\N
1722997909274	1722997869800	메타데이터 검색 목록 조회	메타데이터 검색 목록 조회	/meta/api/v1/public/search/metadata	GET	Y	2024-08-07 11:31:49	tklee1995	택규	2024-08-08 16:37:32	tklee1995	택규
1684990663367	1684374309665	saveMetadataListBySetId	메타데이터 셋의 메타데이터 저장 (Multi) - upsert	/meta/api/v1/resource/metadatasets/%s/properties	PUT	Y	2023-05-25 13:57:43	system	시스템	\N	\N	\N
1685607819796	1684374309665	saveCnctMetadataSetProperty	메타데이터 셋과 셋의 연결(관계) 메타데이터 등록 (insert)	/meta/api/v1/resource/metadatasets/%s/relation	PUT	Y	2023-06-01 17:23:40	system	시스템	\N	\N	\N
1685932667983	1684374309665	getModelTree	메타데이터 모델 트리 조회	/meta/api/v1/schema/models/tree	GET	Y	2023-06-05 11:37:48	system	시스템	\N	\N	\N
1712212497907	1701393170121	getKibanaUrl	ElasticSearch Kibana URL 조회	/meta/api/v1/search/elastic/kibana-url	GET	Y	2024-04-04 15:34:58	system	시스템	\N	\N	\N
1723794296007	1692333550000	replaceAuthUsers	권한 사용자 전체 삭제 후 사용자(멀티) 생성	/admin/auth/%s/users/replace	POST	Y	2024-08-16 16:44:56	meta_admin	메타시스템관리자	\N	\N	\N
1708586234988	1708490013806	getIdSchemeStdIndCode	표준산업분류체계 코드 상세 조회	/meta/api/v1/schema/ksiccodes/%s	GET	Y	2024-02-22 16:17:15	system	시스템	\N	\N	\N
1696927876067	1692333947468	getDataTypeModel	DataType 모델 조회	/meta/api/v1/schema/datatypes/%s	GET	Y	2023-10-10 17:51:16	system	시스템	\N	\N	\N
1696928210688	1692334729497	getTypeModel	유형 모델 조회	/meta/api/v1/schema/typemodels/%s	GET	Y	2023-10-10 17:56:51	system	시스템	\N	\N	\N
1696924034796	1696913843077	getGraphConductorUrl	버투소 Conductor URL	/meta/api/v1/rdf/graph/virtuoso/conductor-url	GET	Y	2023-10-10 16:47:15	system	시스템	\N	\N	\N
1696924628555	1683181683641	checkCountrycode	국가코드 중복체크	/meta/api/v1/portal/countrycodes/check	GET	Y	2023-10-10 16:57:09	system	시스템	\N	\N	\N
1696928073901	1692334188123	getApiModelInfoByModelNm	메타데이터 모델 정보 조회 (외부 API용)	/meta/api/v1/schema/models/%s/info	GET	Y	2023-10-10 17:54:34	system	시스템	\N	\N	\N
1697099948559	1692333550000	createAuthMenu	권한 메뉴 단건 생성	/admin/auth/%s/menu	POST	Y	2023-10-12 17:39:09	system	시스템	\N	\N	\N
1697100003689	1692333550000	createAuthMenus	권한 메뉴 멀티 생성	/admin/auth/%s/menus	POST	Y	2023-10-12 17:40:04	system	시스템	\N	\N	\N
1697100039762	1692333550000	removeAuthMenuList	권한 메뉴 목록 삭제	/admin/auth/%s/menu	DELETE	Y	2023-10-12 17:40:40	system	시스템	\N	\N	\N
1697100097558	1692333550000	removeAuthMenu	권한 메뉴 삭제	/admin/auth/%s/menu/%s	DELETE	Y	2023-10-12 17:41:38	system	시스템	\N	\N	\N
1697100335617	1692333550000	createAuthApi	권한 API 그룹 Oid 생성	/admin/auth/%s/apigroup	POST	Y	2023-10-12 17:45:36	system	시스템	\N	\N	\N
1697100427048	1692333550000	removeAuthApigroups	권한 API 그룹 전체 삭제	/admin/auth/%s/apigroup	DELETE	Y	2023-10-12 17:47:07	system	시스템	\N	\N	\N
1697100272997	1692333550000	getAuthApigroup	권한 API 그룹 상세 조회	/admin/auth/%s/apigroup/%s	GET	Y	2023-10-12 17:44:33	system	시스템	\N	\N	\N
1697100507054	1692333550000	removeAuthApigroup	권한 API 그룹 삭제	/admin/auth/%s/apigroup/%s	DELETE	Y	2023-10-12 17:48:27	system	시스템	\N	\N	\N
1697099683489	1692333550000	createAuthUser	권한 사용자 단건 생성	/admin/auth/%s/user	POST	Y	2023-10-12 17:34:43	system	시스템	\N	\N	\N
1697100203834	1692333550000	getAuthApigroupList	권한 API 그룹 목록 조회	/admin/auth/%s/apigroup	GET	Y	2023-10-12 17:43:24	system	시스템	\N	\N	\N
1697100558014	1678260120000	registerQnaAnswer	QNA 답변 등록	/admin/qna/%s/answer	PATCH	Y	2023-10-12 17:49:18	system	시스템	\N	\N	\N
1697098698826	1692333550000	createAuthApis	권한 API 그룹 Oid 멀티 생성	/admin/auth/%s/apigroups	POST	Y	2023-10-12 17:18:19	system	시스템	\N	\N	\N
1697101050775	1697090069772	getRdfStr	메타데이터 모델을 RDF 모델로 변환된 문자열 조회 (RDF 확인)	/meta/api/v1/schema/models/%s/rdf	GET	Y	2023-10-12 17:57:31	system	시스템	\N	\N	\N
1698216508672	1698213521356	getWorkList	메타데이터 수집 작업 목록 조회	/meta/api/v1/collection/works	GET	Y	2023-10-25 15:48:29	system	시스템	\N	\N	\N
1698216547130	1698213521356	getWork	메타데이터 수집 작업 상세 조회	/meta/api/v1/collection/works/%s	GET	Y	2023-10-25 15:49:07	system	시스템	\N	\N	\N
1698216577996	1698213521356	createWork	메타데이터 수집 작업 등록	/meta/api/v1/collection/works	POST	Y	2023-10-25 15:49:38	system	시스템	\N	\N	\N
1698216610867	1698213521356	updateWork	메타데이터 수집 작업 수정	/meta/api/v1/collection/works/%s	PUT	Y	2023-10-25 15:50:11	system	시스템	\N	\N	\N
1699417159022	1696913843077	executeSparqlQuery	SPARQL 쿼리 실행	/meta/api/v1/rdf/graph/virtuoso/sparql	GET	Y	2023-11-08 13:19:19	system	시스템	\N	\N	\N
1699417612799	1699417573146	executeSparqlQuery	SPARQL 쿼리 실행	/meta/api/v1/rdf/graph/virtuoso/sparql	GET	Y	2023-11-08 13:26:53	system	시스템	\N	\N	\N
1709192663450	1708490013806	getIdSchemeFacilityCodeList	객체 - 시설 코드 목록 조회	/meta/api/v1/schema/facilitycodes	GET	Y	2024-02-29 16:44:23	system	시스템	\N	\N	\N
1709192625971	1708490013806	getIdSchemeProductCodeList	객체 - 물품 코드 목록 조회	/meta/api/v1/schema/productcodes	GET	Y	2024-02-29 16:43:46	system	시스템	\N	\N	\N
1733707129740	1733707070122	removeModelInfoAll	모델 정보 전체를 캐시에서 삭제	/meta/api/v1/portal/caches/model	DELETE	Y	2024-12-09 10:18:50	tklee1995	택규	2024-12-09 10:29:33	tklee1995	택규
1712212532398	1701393170121	initElasticAndAddDataAll	ElasticSearch 초기화 후 재등록 (설정한 인덱스 전체 삭제 후 재등록)	/meta/api/v1/search/elastic/data/init	PUT	Y	2024-04-04 15:35:32	system	시스템	\N	\N	\N
1724807076771	1701393170121	getElasticDataListWithJsonEntityForView	ElasticSearch에 저장된 메타데이터 셋 목록(다건) 조회 (JSON 직접 검색) (화면 호출용)	/meta/api/v1/search/elastic/data/json/enties	GET	Y	2024-08-28 10:04:37	tklee1995	택규	2024-08-28 10:06:06	tklee1995	택규
1739240013067	1737016374758	getJsonMeasurementBySetId	json 메저먼트에서 지정 id의 목록 조회	/meta/api/v1/database/influxdb/data/%s	GET	Y	2025-02-11 11:13:33	solee	소리님	\N	\N	\N
1737016463358	1737016374758	getInfluxDBData		/meta/api/v1/datastore/influxdb/data	GET	Y	2025-01-16 17:34:23	meta_admin	메타시스템관리자	2025-02-06 17:54:16	meta_admin	메타시스템관리자
1753168309018	1753168197084	벡터 검색 질문	자연어 기반의 검색 질문을 통해 벡터 database 를 통한 응답 확인	/meta/api/v1/search/vector/prompt	POST	Y	2025-07-22 16:11:49	n2m_iot	엔투엠1	2025-07-22 16:17:33	n2m_iot	엔투엠1
1682578157359	1682577494093	getAgentList	대리인 관리 페이징 목록 조회	/meta/api/v1/resource/agents	GET	Y	2023-04-27 15:49:17	system	시스템	\N	\N	\N
1682578402633	1682577494093	getAgent	대리인 상세 조회	/meta/api/v1/resource/agents/%s	GET	Y	2023-04-27 15:53:23	system	시스템	\N	\N	\N
1682578999002	1682577494093	deleteAgent	대리인 삭제	/meta/api/v1/resource/agents/%s	DELETE	Y	2023-04-27 16:03:19	system	시스템	\N	\N	\N
1696923035147	1696922694251	initNeo4jRdbGraphAndAddDataAll	NEO4J 그래프 초기화 후 재등록 (설정 초기화 + 내용 전체 삭제 후 재등록) (RDB)	/meta/api/v1/rdf/graph/neo4j/origindata/init	PUT	Y	2023-10-10 16:30:35	system	시스템	\N	\N	\N
1696923286424	1696922694251	deleteNeo4jMetadataSet	셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDF)	/meta/api/v1/rdf/graph/neo4j/data/%s	DELETE	Y	2023-10-10 16:34:46	system	시스템	\N	\N	\N
1696923367524	1696922694251	initNeo4jGraphAndAddDataAll	NEO4J 그래프 초기화 후 재등록 (설정 초기화 + 내용 전체 삭제 후 재등록) (RDF)	/meta/api/v1/rdf/graph/neo4j/data/init	PUT	Y	2023-10-10 16:36:08	system	시스템	\N	\N	\N
1696923417740	1696922694251	getNeo4jRdbMedata	NEO4J 조회 (RDB)	/meta/api/v1/rdf/graph/neo4j/origindata	GET	Y	2023-10-10 16:36:58	system	시스템	\N	\N	\N
1696923465007	1696922694251	getNeo4jData	NEO4J 조회 (RDF)	/meta/api/v1/rdf/graph/neo4j/data	GET	Y	2023-10-10 16:37:45	system	시스템	\N	\N	\N
1696923510104	1696922694251	getNeo4jBrowserUrl	NEO4J Browser URL	/meta/api/v1/rdf/graph/neo4j/browser-url	GET	Y	2023-10-10 16:38:30	system	시스템	\N	\N	\N
1696923904790	1696913843077	initGraphForUse	그래프 초기화 후 재등록 (내용 전체 삭제 후 재등록)	/meta/api/v1/rdf/graph/virtuoso/data/init	PUT	Y	2023-10-10 16:45:05	system	시스템	\N	\N	\N
1696923960243	1696913843077	initGraphForDev	그래프 초기화 후 재등록 (내용 전체 삭제 후 재등록) (dev)	/meta/api/v1/rdf/graph/virtuoso/data/init-dev	PUT	Y	2023-10-10 16:46:00	system	시스템	\N	\N	\N
1696924000424	1696913843077	testConnectVirtuoso	버투소 연결 테스트 (true / false)	/meta/api/v1/rdf/graph/virtuoso/conn	GET	Y	2023-10-10 16:46:40	system	시스템	\N	\N	\N
1696922967722	1696922694251	deleteNeo4jRdbMetadataSet	셋 ID 로 NEO4J 그래프에서 메타데이터 삭제 (RDB)	/meta/api/v1/rdf/graph/neo4j/origindata%s	DELETE	Y	2023-10-10 16:29:28	system	시스템	\N	\N	\N
1708588722196	1708490013806	getIdSchemePubRiCodeList	공공자원분류체계 코드 목록 조회	/meta/api/v1/schema/pbrccodes	GET	Y	2024-02-22 16:58:42	system	시스템	\N	\N	\N
1709193916040	1708490013806	getIdSchemePubRiCode	공자원분류체계 코드 상세 조회	/meta/api/v1/schema/pbrccodes/%s	GET	Y	2024-02-29 17:05:16	system	시스템	\N	\N	\N
1733708131797	1733707070122	removeTypeModelAllByDataUri	유형 모델 정보 전체를 캐시에서 삭제	/meta/api/v1/portal/caches/typemodel	DELETE	Y	2024-12-09 10:35:32	tklee1995	택규	\N	\N	\N
1733708111169	1733707070122	removeModelListAll	모델 목록 전체를 캐시에서 삭제	/meta/api/v1/portal/caches/modellist	DELETE	Y	2024-12-09 10:35:11	tklee1995	택규	2024-12-09 10:35:58	tklee1995	택규
1737684674035	1737016374758	testAddKeyword	키워드 추가 테스트용	/meta/api/v1/datastore/influxdb/keywords	POST	Y	2025-01-24 11:11:14	meta_admin	메타시스템관리자	2025-02-06 17:54:06	meta_admin	메타시스템관리자
1739251251439	1737016374758	getLatestJsonMeasurementByMedataSetId	json measurement 지정 id 의 가장 최근 데이터 단건 조회	/meta/api/v1/database/influxdb/data/%s/latest	GET	Y	2025-02-11 14:20:52	solee	소리님	\N	\N	\N
1753776325503	1708490013806	getIdSchemeFeatureCodeList	객체 - 지형지물 코드 목록 조회	/meta/api/v1/schema/featurecodes	GET	Y	2025-07-29 17:05:26	n2m_iot	엔투엠1	2025-07-29 17:10:35	n2m_iot	엔투엠1
1753776507513	1708490013806	/api/v1/schema/featurecodes	객체 - 지형지물 코드 등록	/meta/api/v1/schema/featurecodes	POST	Y	2025-07-29 17:08:28	n2m_iot	엔투엠1	2025-07-29 17:11:25	n2m_iot	엔투엠1
1697001834045	1697001834043	getNoticeDetail	공지사항 상세 조회	/admin/notice/%s	GET	Y	2023-10-11 14:27:00	system	시스템	\N	\N	\N
1697001834049	1697001834043	getNoticeAttachFiles	공지사항 첨부파일 리스트 조회	/admin/notice/%s/attachFiles	GET	Y	2023-10-11 14:27:00	system	시스템	\N	\N	\N
1697001834053	1697001834043	getFaqListPaging	FAQ 페이징 리스트 조회	/admin/faqPaging	GET	Y	2023-10-11 14:27:00	system	시스템	\N	\N	\N
1708590133707	1708490013806	getIdSchemePubRiLctgCodeList	공공자원분류체계 코드 대분류 외부 코드 목록 조회	/meta/api/v1/schema/pbrccodes/lctgcodes	GET	Y	2024-02-22 17:22:14	system	시스템	\N	\N	\N
1709193948578	1708490013806	getIdSchemeProductCode	객체 - 물품 코드 상세 조회	/meta/api/v1/schema/productcodes/%s	GET	Y	2024-02-29 17:05:49	system	시스템	\N	\N	\N
1733877561743	1733707070122	removePropertyInfoAll	프라퍼티 정보 전체를 캐시에서 삭제	/meta/api/v1/portal/caches/property	DELETE	Y	2024-12-11 09:39:22	tklee1995	택규	\N	\N	\N
1697001834054	1697001834043	getFaqDetail	FAQ 상세 조회	/admin/faq/%s	GET	Y	2023-10-11 14:27:00	system	시스템	\N	\N	\N
1697001834056	1697001834043	getFaqAttachFileList	FAQ 첨부파일 리스트 조회	/admin/faq/%s/attachFiles	GET	Y	2023-10-11 14:27:00	system	시스템	\N	\N	\N
1733877585608	1733707070122	removeAllRdfMapping	RDF 매핑 정보 전체를 캐시에서 삭제	/meta/api/v1/portal/caches/rdf	DELETE	Y	2024-12-11 09:39:46	tklee1995	택규	\N	\N	\N
1733877671637	1733707070122	removeCodeGroupDtoAll	코드 그룹 정보와 코드 정보 전체를 캐시에서 삭제	/meta/api/v1/portal/caches/code	DELETE	Y	2024-12-11 09:41:12	tklee1995	택규	\N	\N	\N
1738746859881	1737016374758	getInfluxDBCountByKeyword	최근 1년 동안의 키워드별 건수 현황 조회	/meta/api/v1/datastore/influxdb/count-by-keyword	GET	Y	2025-02-05 18:14:20	meta_admin	메타시스템관리자	2025-02-06 17:53:55	meta_admin	메타시스템관리자
1739410352969	1737016374758	getJsonMeasurementData	metadata 버킷에서 json measurement data 목록 조회	/meta/api/v1/database/influxdb/data	GET	Y	2025-02-13 10:32:33	solee	소리님	\N	\N	\N
1753776414925	1708490013806	getIdSchemeFeatureCode	객체 - 지형지물 코드 상세 조회 	/meta/api/v1/schema/featurecodes/%s	GET	Y	2025-07-29 17:06:55	n2m_iot	엔투엠1	2025-07-29 17:10:51	n2m_iot	엔투엠1
1708654102113	1708490013806	createIdSchemePubRiLctgCode	공공자원분류체계 코드 등록	/meta/api/v1/schema/pbrccodes	POST	Y	2024-02-23 11:08:22	system	시스템	\N	\N	\N
1697002005543	1697001445182	getMyNotifcList	내 알림 목록	/meta/api/v1/portal/mypage/notifcs	GET	Y	2023-10-11 14:26:46	system	시스템	\N	\N	\N
1697001976569	1697001445182	createMyNotifcSetting	내 알림 설정 등록	/meta/api/v1/portal/mypage/notifcsettings	POST	Y	2023-10-11 14:26:17	system	시스템	\N	\N	\N
1697001964234	1697001445182	getMyNotifcSettingList	내 알림 설정 목록	/meta/api/v1/portal/mypage/notifcsettings	GET	Y	2023-10-11 14:26:04	system	시스템	\N	\N	\N
1709193975047	1708490013806	getIdSchemeFacilityCode	객체 - 시설 코드 상세 조회	/meta/api/v1/schema/facilitycodes/%s	GET	Y	2024-02-29 17:06:15	system	시스템	\N	\N	\N
1733877610446	1733707070122	removeAllRdfMappingModelList	RDF 매핑 모델 정보 전체를 캐시에서 삭제	/meta/api/v1/portal/caches/rdfmodel	DELETE	Y	2024-12-11 09:40:10	tklee1995	택규	\N	\N	\N
1738830526997	1738821673217	getInfluxDBUrl	InfluxDB URL	/meta/api/v1/datastore/influxdb/url	GET	Y	2025-02-06 17:28:47	meta_admin	메타시스템관리자	2025-02-06 17:53:22	meta_admin	메타시스템관리자
1739419611655	1737016374758	getJsonMeasurementBySetIdAndTimestamp	json measurement 지정 medataset id 의 지정 시각의 데이터 단건 조회	/meta/api/v1/database/influxdb/data/%s/%s	GET	Y	2025-02-13 13:06:52	solee	소리님	\N	\N	\N
1753776753346	1708490013806	modifyIdSchemeFeatureCode	객체 - 지형지물 코드 수정	/meta/api/v1/schema/featurecodes/%s	PUT	Y	2025-07-29 17:12:33	n2m_iot	엔투엠1	2025-07-29 17:13:36	n2m_iot	엔투엠1
1697001834061	1697001834043	getQnaListPaging	QNA 페이징 리스트 조회	/admin/qnaPaging	GET	Y	2023-10-11 14:27:00	system	시스템	\N	\N	\N
1697001834062	1697001834043	getQnaDetail	QNA 상세 조회	/admin/qna/%s	GET	Y	2023-10-11 14:27:00	system	시스템	\N	\N	\N
1697001834063	1697001834043	getQnaAttachFileList	게시글 첨부파일 리스트 조회	/admin/qna/%s/attachFiles	GET	Y	2023-10-11 14:27:00	system	시스템	\N	\N	\N
1697001834064	1697001834043	modifyQnaDetail	QNA 수정	/admin/qna/%s	PUT	Y	2023-10-11 14:27:00	system	시스템	\N	\N	\N
1697001834065	1697001834043	deleteQnaDetail	QNA 삭제	/admin/qna/%s	DELETE	Y	2023-10-11 14:27:00	system	시스템	\N	\N	\N
1709599663403	1708490013806	modifyPbrcCode	공공자원분류체계 코드 수정	/meta/api/v1/schema/pbrccodes/%s	PUT	Y	2024-03-05 09:47:43	system	시스템	\N	\N	\N
1733877632875	1733707070122	removeAllRdfMappingRuleList	RDF 매핑 규칙 정보 전체를 캐시에서 삭제	/meta/api/v1/portal/caches/rdfrule	DELETE	Y	2024-12-11 09:40:33	tklee1995	택규	\N	\N	\N
1733877654168	1733707070122	removeAllRdfNamespaceList	RDF 매핑 네임스페이스 정보 전체를 캐시에서 삭제	/meta/api/v1/portal/caches/rdfnamespace	DELETE	Y	2024-12-11 09:40:54	tklee1995	택규	\N	\N	\N
1738904121387	1738821673217	createInfluxDBKeyword	메타데이터 셋의 키워드들을 InfluxDB keyword 에 추가 (기존 데이터 삭제 후)	/meta/api/v1/datastore/influxdb/keywords/%s	PUT	Y	2025-02-07 13:55:21	meta_admin	메타시스템관리자	2025-02-07 13:58:42	meta_admin	메타시스템관리자
1753851407949	1708490013806	checkFeatureCode	객체 - 지형지물 코드 중복여부 조회	/meta/api/v1/schema/featurecodes/%s/check	GET	Y	2025-07-30 13:56:48	solee	소리님	\N	\N	\N
1697001938757	1697001445182	getMyNotifcConfirmedList	내 확인된 알림 목록	/meta/api/v1/portal/mypage/confirmednotifcs	GET	Y	2023-10-11 14:25:39	system	시스템	\N	\N	\N
1697001951398	1697001445182	saveMyConfirmedNotifc	내 알림 확인	/meta/api/v1/portal/mypage/confirmednotifcs	PUT	Y	2023-10-11 14:25:51	system	시스템	\N	\N	\N
1678260100009	1678260100000	patchNoticeHit	공자사항 조회 수 증가	/admin/notice/%s/hit	PATCH	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1697001834068	1697001834043	patchNoticeHit	공자사항 조회 수 증가	/admin/notice/%s/hit	PATCH	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1678260097441	1678260074028	patchNoticeHit	공자사항 조회 수 증가	/admin/notice/%s/hit	PATCH	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1697001834060	1697001834043	setQnaDetail	QNA 등록	/admin/qna	POST	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1709602697202	1708490013806	createProductCode	객체 - 물품 코드 등록	/meta/api/v1/schema/productcodes	POST	Y	2024-03-05 10:38:17	system	시스템	\N	\N	\N
1678261074920	1678261033803	setQnaDetail	QNA 등록	/admin/qna	POST	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1678260120004	1678260120000	setQnaDetail	QNA 등록	/admin/qna	POST	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1678260120007	1678260120000	patchQnaHit	QNA 조회 수 증가	/admin/qna/%s/hit	PATCH	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1697001834066	1697001834043	patchQnaHit	QNA 조회 수 증가	/admin/qna/%s/hit	PATCH	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1678261074921	1678261033803	patchQnaHit	QNA 조회 수 증가	/admin/qna/%s/hit	PATCH	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1678260965257	1678260904747	patchFaqHit	FAQ 조회 수 증가	/admin/faq/%s/hit	PATCH	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1678260110010	1678260110000	patchFaqHit	FAQ 조회 수 증가	/admin/faq/%s/hit	PATCH	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1697001834057	1697001834043	patchFaqHit	FAQ 조회 수 증가	/admin/faq/%s/hit	PATCH	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1678262027616	1678261963107	getApigroupList	API 그룹 목록 조회	/admin/apigroup	GET	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1692333570011	1692333570000	getApigroupList	API 그룹 목록 조회	/admin/apigroup	GET	Y	2023-10-12 00:00:00	system	시스템	\N	\N	\N
1738904288948	1738821673217	deleteInfluxDBKeyword	메타데이터 셋의 키워드들을 InfluxDB keyword 에서 삭제	/meta/api/v1/datastore/influxdb/keywords/%s	DELETE	Y	2025-02-07 13:58:09	meta_admin	메타시스템관리자	2025-02-07 13:58:28	meta_admin	메타시스템관리자
1738904348668	1738821673217	initializeInfluxDBKeyword	InfluxDB 의 키워드 측정 데이터 전체 초기화 (재등록 값들은 시간이 정확하지 않음)	/meta/api/v1/datastore/influxdb/keywords/init	PUT	Y	2025-02-07 13:59:09	meta_admin	메타시스템관리자	2025-02-07 13:59:49	meta_admin	메타시스템관리자
1753941424778	1684374309665	checkMetadatasetsForFeatureCd	지형지물 코드 - 메타데이터 셋 등록 시,지형지물 코드 중복확인 여부 조회	/meta/api/v1/resource/metadatasets/check-id	POST	Y	2025-07-31 14:57:05	solee	소리님	\N	\N	\N
1697097100472	1697090069772	getPropertyList	메타데이터 프라퍼티 목록 조회	/meta/api/v1/schema/properties	GET	Y	2023-10-12 16:51:40	system	시스템	\N	\N	\N
1697097236137	1697090069772	getTypeModelList	유형 모델 목록 조회	/meta/api/v1/schema/typemodels	GET	Y	2023-10-12 16:53:56	system	시스템	\N	\N	\N
1709603619565	1708490013806	modifyProductCode	객체 - 물품 코드 수정	/meta/api/v1/schema/productcodes/%s	PUT	Y	2024-03-05 10:53:40	system	시스템	\N	\N	\N
1754904064591	1754903956578	createDigitalTwin	디지털 트윈 인스턴스 등록	/meta/digitalTwins	POST	Y	2025-08-11 18:21:05	meta_admin	메타시스템관리자	2025-08-11 18:29:22	meta_admin	메타시스템관리자
1697093787380	1697090069772	getMetadataList	메타데이터 목록 조회	/meta/api/v1/resource/metadata	GET	Y	2023-10-12 15:56:27	system	시스템	\N	\N	\N
1697099183695	1692333550000	getAuthList	권한 목록 조회	/admin/auth	GET	Y	2023-10-12 17:26:24	system	시스템	\N	\N	\N
1709604122430	1708490013806	createFacilityCode	객체 - 시설 코드 등록	/meta/api/v1/schema/facilitycodes	POST	Y	2024-03-05 11:02:02	system	시스템	\N	\N	\N
1754904087169	1754903956578	getDigitalTwinList	디지털 트윈 인스턴스 목록 조회	/meta/digitalTwins	GET	Y	2025-08-11 18:21:27	meta_admin	메타시스템관리자	2025-08-11 18:29:33	meta_admin	메타시스템관리자
1678255891796	1678255242692	setAuthMenus	해당 권한의 메뉴 리스트 등록	/admin/auth/%s/menus	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1709605772091	1708490013806	modifyFacilityCode	객체 - 시설 코드 수정	/meta/api/v1/schema/facilitycodes/%s	PUT	Y	2024-03-05 11:29:32	system	시스템	\N	\N	\N
1678259733426	1678257466870	setCodegroup	코드 그룹 등록	/admin/codegroup	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678259817320	1678257466870	getCodegroupDetail	권한 그룹 상세 조회	/admin/codegroup/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678259856197	1678257466870	modifyCodegroupDetail	코드 그룹 수정	/admin/codegroup/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678259880484	1678257466870	deleteCodegroupDetail	코드 그룹 삭제	/admin/codegroup/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678259925837	1678257466870	getCodes	코드 리스트 조회	/admin/codegroup/%s/codes	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678259946690	1678257466870	setCode	코드 등록	/admin/codegroup/%s/codes	POST	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678259968589	1678257466870	modifyCode	코드 수정	/admin/codegroup/%s/codes/%s	PUT	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678259989849	1678257466870	deleteCode	코드 삭제	/admin/codegroup/%s/codes/%s	DELETE	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260044796	1678260012068	getUserPaging	사용자 페이징 리스트 조회	/admin/userPaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1678260097440	1678260074028	getNoticePaging	공지사항 페이징 리스트 조회	/admin/noticePaging	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1754975271200	1754903956578	searchDigitalTwin	디지털 트윈 인스턴스 조회 (인스턴스 속성, 인스턴스 객체 속성 조회)	/meta/digitalTwins/search	GET	Y	2025-08-12 14:07:51	meta_admin	메타시스템관리자	2025-08-12 14:09:58	meta_admin	메타시스템관리자
1678260310366	1678260074028	getNoticeDetail	공지사항 상세 조회	/admin/notice/%s	GET	Y	2023-03-08 00:00:00	system	시스템	\N	\N	\N
1754975368222	1754903956578	putDigitalTwin	디지털 트윈 인스턴스 수정	/meta/digitalTwins/%s	PUT	Y	2025-08-12 14:09:28	meta_admin	메타시스템관리자	\N	\N	\N
1754975443348	1754903956578	deleteDigitalTwin	디지털 트윈 인스턴스 삭제	/meta/digitalTwins/%s	DELETE	Y	2025-08-12 14:10:43	meta_admin	메타시스템관리자	\N	\N	\N
1697093838743	1697090069772	getMetadata	메타데이터 조회	/meta/api/v1/resource/metadata/%s	GET	Y	2023-10-12 15:57:19	system	시스템	\N	\N	\N
1697783293844	1683086628995	isNmDuplicated	카테고리 RDF 개념 명 중복 조회	/meta/api/v1/resource/categories/check	GET	Y	2023-10-20 15:28:14	system	시스템	\N	\N	\N
1698026527788	1698026390150	getDataMapFromMetadataSet	유형 모델별 메타데이터 셋 조회	/meta/api/v1/resource/%s/%s	GET	Y	2023-10-23 11:02:08	system	시스템	\N	\N	\N
1698026566448	1698026390150	createMetadataSetByDataUri	유형 모델별 메타데이터 셋 생성 (Multi)	/meta/api/v1/resource/%s	POST	Y	2023-10-23 11:02:46	system	시스템	\N	\N	\N
1698026733667	1698026390150	modifyMetadataSetByDataUri	유형 모델별 메타데이터 셋 수정	/meta/api/v1/resource/%s/%s	PUT	Y	2023-10-23 11:05:34	system	시스템	\N	\N	\N
1698026767957	1698026390150	deleteMetadataSetByDataUri	유형 모델별 메타데이터 셋 삭제	/meta/api/v1/resource/%s/%s	DELETE	Y	2023-10-23 11:06:08	system	시스템	\N	\N	\N
1698026806541	1698026390150	changeMetadataSetStatusByDataUri	유형 모델별 메타데이터 셋 상태 변경	/meta/api/v1/resource/%s/%s	PATCH	Y	2023-10-23 11:06:47	system	시스템	\N	\N	\N
1698026871800	1698026390150	getPropertyValueListByDataUri	유형 모델별 메타데이터 프라퍼티 조회	/meta/api/v1/resource/%s/%s/properties/%s	GET	Y	2023-10-23 11:07:52	system	시스템	\N	\N	\N
1698026928009	1698026390150	savePropertyValueListByDataUri	유형 모델별 메타데이터 프라퍼티 저장 (Multi) - upsert	/meta/api/v1/resource/%s/%s/properties/%s	PUT	Y	2023-10-23 11:08:48	system	시스템	\N	\N	\N
1698026950174	1698026390150	deletePropertyValueListByDataUri	유형 모델별 메타데이터 프라퍼티 삭제 (Multi)	/meta/api/v1/resource/%s/%s/properties/%s	DELETE	Y	2023-10-23 11:09:10	system	시스템	\N	\N	\N
1698026982627	1698026390150	getDataMapFromMetadataSet	메타데이터 셋 조회 (유형 상관 없음)	/meta/api/v1/resource/data/%s	GET	Y	2023-10-23 11:09:43	system	시스템	\N	\N	\N
1698026982631	1698026390160	getDataMapFromMetadataSet	유형 모델별 메타데이터 셋 조회	/meta/api/v1/resource/%s/%s	GET	Y	2023-10-23 11:12:43	system	시스템	\N	\N	\N
1698026982632	1698026390160	getPropertyValueListByDataUri	유형 모델별 메타데이터 프라퍼티 조회	/meta/api/v1/resource/%s/%s/properties/%s	GET	Y	2023-10-23 11:12:43	system	시스템	\N	\N	\N
1698026982633	1698026390160	getDataMapFromMetadataSet	메타데이터 셋 조회 (유형 상관 없음)	/meta/api/v1/resource/data/%s	GET	Y	2023-10-23 11:12:43	system	시스템	\N	\N	\N
1698026469518	1698026390150	getDataMapListByDataUri	유형 모델별 메타데이터 셋 목록 조회	/meta/api/v1/resource/%s	GET	Y	2023-10-23 11:01:10	system	시스템	\N	\N	\N
1698214022217	1698213521356	getLog	메타데이터 수집 로그 상세 조회	/meta/api/v1/collection/logs/%s	GET	Y	2023-10-25 15:07:02	system	시스템	\N	\N	\N
1698214068770	1698213521356	createLog	메타데이터 수집 로그 등록	/meta/api/v1/collection/logs	POST	Y	2023-10-25 15:07:49	system	시스템	\N	\N	\N
\.

-- 권한
COPY common.tb_com_auth (aut_oid, aut_id, aut_nm, aut_desc, pltfrm_id, use_yn, type_cd, reg_dt, regr_id, regr_nm, amd_dt, amdr_id, amdr_nm) FROM stdin;
AUT_META_DATPUBLISHER	AUT_META_DATPUBLISHER	메타데이터 제공자	메타데이터 제공자	meta	Y	COD_00001	2023-04-17 00:00:00	system	시스템	\N	\N	\N
AUT_META_DATVIEWER	AUT_META_DATVIEWER	메타데이터 조회자	메타데이터 조회자	meta	Y	COD_00001	2023-04-17 00:00:00	system	시스템	\N	\N	\N
AUT_META_DEFAULT	AUT_META_DEFAULT	메타데이터 기본사용자	메타데이터 기본사용자 (로그인만 하면 기본적으로 주어지는 권한)	meta	Y	COD_00001	2023-04-17 00:00:00	system	시스템	\N	\N	\N
AUT_META_SYSADMIN	AUT_META_SYSADMIN	시스템 관리자	시스템 관리자	meta	Y	COD_00001	2023-04-17 00:00:00	system	시스템	\N	\N	\N
AUT_META_DATADMIN	AUT_META_DATADMIN	메타데이터 관리자	메타데이터 관리자	meta	Y	COD_00001	2023-04-17 00:00:00	system	시스템	\N	\N	\N
\.

-- 권한-사용자 매핑
COPY common.tb_com_authusermap (aut_oid, user_oid, user_id, nickname, phone, email) FROM stdin;
AUT_META_SYSADMIN	\N	meta_admin	메타시스템관리자	00-000-0000	meta_admin@test.com
AUT_META_SYSADMIN	\N	admin	admin	00-000-0000	admin@test.com
AUT_META_SYSADMIN	\N	n2m_iot	엔투엠1	00-000-0000	n2m@test.com
AUT_META_DATPUBLISHER	\N	meta_tester1	메타데이터제공자1	00-000-0000	meta_tester1@test.com
AUT_META_DATADMIN	\N	meta_tester2	메타데이터관리자2	00-000-0000	meta_tester2@test.com
AUT_META_DATVIEWER	\N	meta_tester3	메타데이터조회자3	00-000-0000	meta_tester3@test.com
AUT_META_DEFAULT	\N	meta_tester4	메타데이터사용자4	00-000-0000	meta_tester4@test.com
AUT_META_SYSADMIN	\N	keti_dt	케티	00-000-0000	keti1@test.com
\.

-- 권한-메뉴 매핑
COPY common.tb_com_authmenumap (aut_oid, menu_oid, read_yn, write_yn, amd_yn, del_yn) FROM stdin;
AUT_META_DATADMIN	1682402341877	Y	Y	Y	Y
AUT_META_DATADMIN	1682402271874	Y	Y	Y	Y
AUT_META_DATADMIN	1682402308067	Y	Y	Y	Y
AUT_META_DATADMIN	1707120179652	Y	Y	Y	Y
AUT_META_DATADMIN	1682402017103	Y	Y	Y	Y
AUT_META_DATADMIN	1759222852485	Y	N	N	N
AUT_META_DATADMIN	1722926321863	Y	N	N	N
AUT_META_DATADMIN	1682398964622	Y	N	N	N
AUT_META_DATADMIN	1682399002693	Y	N	N	N
AUT_META_DATADMIN	1682399033827	Y	N	N	N
AUT_META_DATADMIN	1695105172143	Y	N	N	N
AUT_META_DATADMIN	1699405773956	Y	N	N	N
AUT_META_DATADMIN	1723597166991	Y	N	N	N
AUT_META_DATADMIN	1737363865006	Y	N	N	N
AUT_META_DATADMIN	1681966425260	Y	N	N	N
AUT_META_DATADMIN	1682399102742	Y	Y	Y	Y
AUT_META_DATADMIN	1682399159028	Y	Y	Y	Y
AUT_META_DATADMIN	1694741596974	Y	Y	Y	Y
AUT_META_DATADMIN	1692681928948	Y	Y	Y	Y
AUT_META_DATADMIN	1739437934191	Y	N	N	N
AUT_META_DATADMIN	1681966455502	Y	Y	Y	Y
AUT_META_DATADMIN	1682067336223	Y	Y	Y	Y
AUT_META_DATADMIN	1682399499137	Y	Y	Y	Y
AUT_META_DATADMIN	1682399419740	Y	Y	Y	Y
AUT_META_DATADMIN	1682399624683	Y	Y	Y	Y
AUT_META_DATADMIN	1682399684317	Y	Y	Y	Y
AUT_META_DATADMIN	1681780796529	Y	Y	Y	Y
AUT_META_DATADMIN	1682402480985	Y	Y	Y	Y
AUT_META_DATADMIN	1682402560208	Y	Y	Y	Y
AUT_META_DATADMIN	1682402593019	Y	Y	Y	Y
AUT_META_DATADMIN	1682402632618	Y	Y	Y	Y
AUT_META_DATADMIN	1681966494939	Y	Y	Y	Y
AUT_META_DATADMIN	1682398131762	Y	Y	Y	Y
AUT_META_DATADMIN	1687928770886	Y	Y	Y	Y
AUT_META_DATADMIN	1708478153246	Y	Y	Y	Y
AUT_META_DATADMIN	1708478238863	Y	Y	Y	Y
AUT_META_DATADMIN	1708478389618	Y	Y	Y	Y
AUT_META_DATADMIN	1708478512851	Y	Y	Y	Y
AUT_META_DATADMIN	1681966569345	Y	Y	Y	Y
AUT_META_DATADMIN	1682398453020	Y	Y	Y	Y
AUT_META_DATADMIN	1682398522757	Y	Y	Y	Y
AUT_META_DATADMIN	1682398630504	Y	Y	Y	Y
AUT_META_DATADMIN	1681966604809	Y	Y	Y	Y
AUT_META_DATADMIN	1778049009203	Y	N	N	N
AUT_META_SYSADMIN	1682402341877	Y	Y	Y	Y
AUT_META_SYSADMIN	1682402271874	Y	Y	Y	Y
AUT_META_SYSADMIN	1682402308067	Y	Y	Y	Y
AUT_META_SYSADMIN	1707120179652	Y	Y	Y	Y
AUT_META_SYSADMIN	1682402094469	Y	Y	Y	Y
AUT_META_SYSADMIN	1682402017103	Y	Y	Y	Y
AUT_META_SYSADMIN	1759222852485	Y	Y	Y	Y
AUT_META_SYSADMIN	1722926321863	Y	Y	Y	Y
AUT_META_SYSADMIN	1682398964622	Y	Y	Y	Y
AUT_META_SYSADMIN	1682399002693	Y	Y	Y	Y
AUT_META_SYSADMIN	1682399033827	Y	Y	Y	Y
AUT_META_SYSADMIN	1695105172143	Y	Y	Y	Y
AUT_META_SYSADMIN	1699405773956	Y	Y	Y	Y
AUT_META_SYSADMIN	1723597166991	Y	Y	Y	Y
AUT_META_SYSADMIN	1737363865006	Y	Y	Y	Y
AUT_META_SYSADMIN	1681966425260	Y	Y	Y	Y
AUT_META_SYSADMIN	1682399102742	Y	Y	Y	Y
AUT_META_SYSADMIN	1682399159028	Y	Y	Y	Y
AUT_META_SYSADMIN	1682399325616	Y	Y	Y	Y
AUT_META_SYSADMIN	1694741596974	Y	Y	Y	Y
AUT_META_SYSADMIN	1692681928948	Y	Y	Y	Y
AUT_META_SYSADMIN	1739437934191	Y	Y	Y	Y
AUT_META_SYSADMIN	1681966455502	Y	Y	Y	Y
AUT_META_SYSADMIN	1682067336223	Y	Y	Y	Y
AUT_META_SYSADMIN	1682399499137	Y	Y	Y	Y
AUT_META_SYSADMIN	1682399419740	Y	Y	Y	Y
AUT_META_SYSADMIN	1682399624683	Y	Y	Y	Y
AUT_META_DATPUBLISHER	1682402341877	Y	Y	Y	Y
AUT_META_DATPUBLISHER	1682402271874	Y	Y	Y	Y
AUT_META_DATPUBLISHER	1682402308067	Y	Y	Y	N
AUT_META_DATPUBLISHER	1707120179652	Y	Y	Y	Y
AUT_META_DATPUBLISHER	1682402017103	Y	Y	Y	N
AUT_META_DATPUBLISHER	1722926321863	Y	N	N	N
AUT_META_DATPUBLISHER	1682398964622	Y	N	N	N
AUT_META_DATPUBLISHER	1682399002693	Y	N	N	N
AUT_META_DATPUBLISHER	1682399033827	Y	N	N	N
AUT_META_DATPUBLISHER	1695105172143	Y	N	N	N
AUT_META_DATPUBLISHER	1699405773956	Y	N	N	N
AUT_META_DATPUBLISHER	1681966425260	Y	N	N	N
AUT_META_DATPUBLISHER	1682399102742	Y	Y	Y	Y
AUT_META_DATPUBLISHER	1682399159028	Y	Y	Y	Y
AUT_META_DATPUBLISHER	1694741596974	Y	Y	Y	Y
AUT_META_DATPUBLISHER	1692681928948	Y	Y	Y	Y
AUT_META_DATPUBLISHER	1681966455502	Y	Y	Y	Y
AUT_META_DATPUBLISHER	1682398453020	Y	N	N	N
AUT_META_DATPUBLISHER	1682398522757	Y	N	N	N
AUT_META_DATPUBLISHER	1682398630504	Y	Y	Y	N
AUT_META_DATPUBLISHER	1681966604809	Y	N	N	N
AUT_META_DATPUBLISHER	1721119727537	Y	Y	Y	Y
AUT_META_DATPUBLISHER	1778049009203	Y	N	N	N
AUT_META_DATPUBLISHER	1759222852485	Y	N	N	N
AUT_META_SYSADMIN	1682399684317	Y	Y	Y	Y
AUT_META_SYSADMIN	1681780796529	Y	Y	Y	Y
AUT_META_SYSADMIN	1682402480985	Y	Y	Y	Y
AUT_META_SYSADMIN	1682402560208	Y	Y	Y	Y
AUT_META_SYSADMIN	1682402593019	Y	Y	Y	Y
AUT_META_SYSADMIN	1682402632618	Y	Y	Y	Y
AUT_META_SYSADMIN	1681966494939	Y	Y	Y	Y
AUT_META_SYSADMIN	1682398131762	Y	Y	Y	Y
AUT_META_SYSADMIN	1682398225402	Y	Y	Y	Y
AUT_META_SYSADMIN	1682398060600	Y	Y	Y	Y
AUT_META_SYSADMIN	1682403560715	Y	Y	Y	Y
AUT_META_SYSADMIN	1687928770886	Y	Y	Y	Y
AUT_META_SYSADMIN	1708478153246	Y	Y	Y	Y
AUT_META_SYSADMIN	1708478238863	Y	Y	Y	Y
AUT_META_SYSADMIN	1708478389618	Y	Y	Y	Y
AUT_META_SYSADMIN	1708478512851	Y	Y	Y	Y
AUT_META_SYSADMIN	1753838128973	Y	Y	Y	Y
AUT_META_SYSADMIN	1681966569345	Y	Y	Y	Y
AUT_META_SYSADMIN	1698281589200	Y	Y	Y	Y
AUT_META_SYSADMIN	1698281199007	Y	Y	Y	Y
AUT_META_SYSADMIN	1682402167018	Y	Y	Y	Y
AUT_META_SYSADMIN	1682398453020	Y	Y	Y	Y
AUT_META_SYSADMIN	1682398522757	Y	Y	Y	Y
AUT_META_SYSADMIN	1682398630504	Y	Y	Y	Y
AUT_META_SYSADMIN	1681966604809	Y	Y	Y	Y
AUT_META_SYSADMIN	1691461287601	Y	Y	Y	Y
AUT_META_SYSADMIN	1693378620159	Y	Y	Y	Y
AUT_META_SYSADMIN	1681974843873	Y	Y	Y	Y
AUT_META_SYSADMIN	1681966746942	Y	Y	Y	Y
AUT_META_SYSADMIN	1681966652759	Y	Y	Y	Y
AUT_META_SYSADMIN	1681969773156	Y	Y	Y	Y
AUT_META_SYSADMIN	1681969688418	Y	Y	Y	Y
AUT_META_SYSADMIN	1733460807842	Y	Y	Y	Y
AUT_META_SYSADMIN	1681965530796	Y	Y	Y	Y
AUT_META_SYSADMIN	1721119727537	Y	Y	Y	Y
AUT_META_SYSADMIN	1778049009203	Y	Y	Y	Y
AUT_META_DATVIEWER	1682402341877	Y	Y	Y	Y
AUT_META_DATVIEWER	1682402308067	Y	Y	Y	N
AUT_META_DATVIEWER	1682402017103	Y	N	N	N
AUT_META_DATVIEWER	1722926321863	Y	N	N	N
AUT_META_DATVIEWER	1682398964622	Y	N	N	N
AUT_META_DEFAULT	1682398453020	Y	N	N	N
AUT_META_DEFAULT	1682398522757	Y	N	N	N
AUT_META_DEFAULT	1682398630504	Y	Y	Y	N
AUT_META_DEFAULT	1681966604809	Y	N	N	N
AUT_META_DEFAULT	1682402017103	Y	Y	Y	N
AUT_META_DEFAULT	1682402308067	Y	Y	Y	N
AUT_META_DEFAULT	1682402341877	Y	Y	Y	Y
AUT_META_DATVIEWER	1682399002693	Y	N	N	N
AUT_META_DATVIEWER	1682399033827	Y	N	N	N
AUT_META_DATVIEWER	1695105172143	Y	N	N	N
AUT_META_DATVIEWER	1699405773956	Y	N	N	N
AUT_META_DATVIEWER	1681966425260	Y	N	N	N
AUT_META_DATVIEWER	1682398453020	Y	N	N	N
AUT_META_DATVIEWER	1682398522757	Y	N	N	N
AUT_META_DATVIEWER	1682398630504	Y	Y	Y	N
AUT_META_DATVIEWER	1681966604809	Y	N	N	N
AUT_META_DATVIEWER	1778049009203	Y	N	N	N
AUT_META_DATVIEWER	1759222852485	Y	N	N	N
\.

-- 권한-API 매핑
COPY common.tb_com_authapimap (aut_oid, api_grp_oid) FROM stdin;
AUT_META_DATVIEWER	1697001445182
AUT_META_DATVIEWER	1697001834043
AUT_META_DATVIEWER	1697090069772
AUT_META_DATVIEWER	1697095431263
AUT_META_DATVIEWER	1698026390160
AUT_META_DATVIEWER	1699417573146
AUT_META_DATVIEWER	1722997869800
AUT_META_DATPUBLISHER	1707187116687
AUT_META_DATPUBLISHER	1697001445182
AUT_META_DATPUBLISHER	1697001834043
AUT_META_DATPUBLISHER	1684374309665
AUT_META_DATPUBLISHER	1697090069772
AUT_META_DATPUBLISHER	1697095431263
AUT_META_DATPUBLISHER	1698026390150
AUT_META_DATPUBLISHER	1699417573146
AUT_META_DATPUBLISHER	1722997869800
AUT_META_DATADMIN	1707187116687
AUT_META_DATADMIN	1722997869800
AUT_META_DATADMIN	1697001445182
AUT_META_DATADMIN	1697001834043
AUT_META_DATADMIN	1678260100000
AUT_META_DATADMIN	1678260110000
AUT_META_DATADMIN	1678260120000
AUT_META_DATADMIN	1692334515538
AUT_META_DATADMIN	1692334729497
AUT_META_DATADMIN	1692334854665
AUT_META_DATADMIN	1692335211578
AUT_META_DATADMIN	1692334188123
AUT_META_DATADMIN	1692333947468
AUT_META_DATADMIN	1683086628995
AUT_META_DATADMIN	1683181683641
AUT_META_DATADMIN	1684374309665
AUT_META_DATADMIN	1684137482763
AUT_META_DATADMIN	1682052959775
AUT_META_DATADMIN	1682577494093
AUT_META_DATADMIN	1692331647806
AUT_META_DATADMIN	1692332647322
AUT_META_DATADMIN	1692332995430
AUT_META_SYSADMIN	1701393170121
AUT_META_SYSADMIN	1708490013806
AUT_META_SYSADMIN	1707187116687
AUT_META_SYSADMIN	1722997869800
AUT_META_SYSADMIN	1733707070122
AUT_META_SYSADMIN	1737016374758
AUT_META_SYSADMIN	1753168197084
AUT_META_SYSADMIN	1697001445182
AUT_META_SYSADMIN	1692326675810
AUT_META_SYSADMIN	1696922694251
AUT_META_SYSADMIN	1696913843077
AUT_META_SYSADMIN	1697001834043
AUT_META_SYSADMIN	1692333540000
AUT_META_SYSADMIN	1692333550000
AUT_META_SYSADMIN	1692333560000
AUT_META_SYSADMIN	1692333570000
AUT_META_SYSADMIN	1692333580000
AUT_META_SYSADMIN	1738821673217
AUT_META_SYSADMIN	1678260100000
AUT_META_DATADMIN	1697090069772
AUT_META_DATADMIN	1697095431263
AUT_META_DATADMIN	1697097728017
AUT_META_DATADMIN	1698026390150
AUT_META_DATADMIN	1699417573146
AUT_META_DATADMIN	1737016374758
AUT_META_DEFAULT	1697001445182
AUT_META_DEFAULT	1697001834043
AUT_META_DEFAULT	1697095431263
AUT_META_SYSADMIN	1678260110000
AUT_META_SYSADMIN	1678260120000
AUT_META_SYSADMIN	1692334515538
AUT_META_SYSADMIN	1692334729497
AUT_META_SYSADMIN	1692334854665
AUT_META_SYSADMIN	1692335211578
AUT_META_SYSADMIN	1692334188123
AUT_META_SYSADMIN	1692333947468
AUT_META_SYSADMIN	1683086628995
AUT_META_SYSADMIN	1683181683641
AUT_META_SYSADMIN	1684374309665
AUT_META_SYSADMIN	1684137482763
AUT_META_SYSADMIN	1682052959775
AUT_META_SYSADMIN	1682577494093
AUT_META_SYSADMIN	1692331647806
AUT_META_SYSADMIN	1692332647322
AUT_META_SYSADMIN	1692332995430
AUT_META_SYSADMIN	1697090069772
AUT_META_SYSADMIN	1697095431263
AUT_META_SYSADMIN	1697097728017
AUT_META_SYSADMIN	1698026390150
AUT_META_SYSADMIN	1698026390160
AUT_META_SYSADMIN	1699417573146
AUT_META_SYSADMIN	1698213521356
AUT_META_SYSADMIN	1754903956578
\.

