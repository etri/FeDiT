package kr.co.e8ight.ndxpro.fileservice.service;

import java.util.concurrent.Future;

interface Observer<T> {
    void update(T value);
    Long getTarget();
    Future<T> getFuture();
}