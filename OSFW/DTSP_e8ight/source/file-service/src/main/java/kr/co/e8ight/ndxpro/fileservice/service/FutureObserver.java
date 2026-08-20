package kr.co.e8ight.ndxpro.fileservice.service;

import java.util.concurrent.CompletableFuture;

public class FutureObserver<T> implements Observer<T> {
    private Long target;
    private CompletableFuture<T> future;

    public FutureObserver(Long target, CompletableFuture<T> future) {
        this.target = target;
        this.future = future;
    }

    @Override
    public void update(T value) {
        future.complete(value);
    }

    @Override
    public Long getTarget() {
        return target;
    }

    @Override
    public CompletableFuture<T> getFuture() {
        return future;
    }
}
