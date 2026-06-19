package com.concert.booking.modules.customerbooking.socket;

import com.concert.booking.modules.customerbooking.dto.SeatSnapshotDTO;
import com.concert.booking.modules.seat.Seat;
import com.concert.booking.modules.seat.SeatRepository;
import com.concert.booking.modules.seat.redis.SeatHoldRedisService;
import com.corundumstudio.socketio.SocketIOServer;
import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatSocketService {

  static final String JOIN_EVENT = "join-event";
  static final String SEAT_SNAPSHOT = "seat-snapshot";
  static final String SEAT_HELD = "seat-held";
  static final String SEAT_RELEASED = "seat-released";
  static final String SEAT_SOLD = "seat-sold";

  SocketIOServer socketIOServer;
  SeatRepository seatRepository;
  SeatHoldRedisService seatHoldRedisService;

  @PostConstruct
  void registerListeners() {
    socketIOServer.addEventListener(
        JOIN_EVENT,
        JoinEventRequest.class,
        (client, request, ackSender) -> {
          UUID eventId = parseEventId(request);
          if (eventId == null) {
            client.sendEvent("socket-error", "Invalid eventId");
            return;
          }

          String room = roomName(eventId);
          client.joinRoom(room);
          client.sendEvent(SEAT_SNAPSHOT, getSeatSnapshot(eventId));
          log.debug("Socket client {} joined {}", client.getSessionId(), room);
        });
  }

  public void emitSeatHeld(UUID eventId, List<UUID> seatIds, Instant expiresAt) {
    socketIOServer
        .getRoomOperations(roomName(eventId))
        .sendEvent(
            SEAT_HELD,
            SeatHeldSocketEvent.builder()
                .eventId(eventId)
                .seatIds(seatIds)
                .expiresAt(expiresAt)
                .build());
  }

  public void emitSeatReleased(UUID eventId, List<UUID> seatIds) {
    emitSeatChanged(SEAT_RELEASED, eventId, seatIds);
  }

  public void emitSeatSold(UUID eventId, List<UUID> seatIds) {
    emitSeatChanged(SEAT_SOLD, eventId, seatIds);
  }

  private void emitSeatChanged(String eventName, UUID eventId, List<UUID> seatIds) {
    socketIOServer
        .getRoomOperations(roomName(eventId))
        .sendEvent(
            eventName, SeatChangedSocketEvent.builder().eventId(eventId).seatIds(seatIds).build());
  }

  private UUID parseEventId(JoinEventRequest request) {
    if (request == null || request.getEventId() == null || request.getEventId().isBlank()) {
      return null;
    }

    try {
      return UUID.fromString(request.getEventId());
    } catch (IllegalArgumentException ex) {
      return null;
    }
  }

  private String roomName(UUID eventId) {
    return "event:" + eventId;
  }

  private SeatSnapshotDTO getSeatSnapshot(UUID eventId) {
    List<UUID> soldSeatIds =
        seatRepository.findSoldSeatsByEventId(eventId).stream().map(Seat::getId).toList();
    return SeatSnapshotDTO.builder()
        .eventId(eventId)
        .heldSeatIds(seatHoldRedisService.getHeldSeatIds(eventId))
        .soldSeatIds(soldSeatIds)
        .generatedAt(Instant.now())
        .build();
  }
}
