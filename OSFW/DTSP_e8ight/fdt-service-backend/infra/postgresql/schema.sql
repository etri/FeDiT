create user ndxpro password 'ndxpro123!';

create database ndxpro owner ndxpro;

\c ndxpro

create schema agent_manager;
alter schema agent_manager owner to ndxpro;

create schema ngsi_translator;
alter schema ngsi_translator owner to ndxpro;

create schema member;
alter schema member owner to ndxpro;
