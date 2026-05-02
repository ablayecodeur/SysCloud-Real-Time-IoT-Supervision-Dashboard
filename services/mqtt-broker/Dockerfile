FROM eclipse-mosquitto:2.0.18-openssl

# The base image already creates the mosquitto user (uid 1883)
# We just need to initialise an empty password file with correct permissions
RUN touch /mosquitto/config/mosquitto.passwd && \
    chown mosquitto:mosquitto /mosquitto/config/mosquitto.passwd && \
    chmod 600 /mosquitto/config/mosquitto.passwd

COPY config/mosquitto.conf /mosquitto/config/mosquitto.conf

VOLUME ["/mosquitto/data", "/mosquitto/log"]

EXPOSE 1883 9001

USER mosquitto
