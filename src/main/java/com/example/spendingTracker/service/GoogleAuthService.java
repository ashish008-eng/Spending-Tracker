//package com.example.spendingTracker.service;
//
//import com.example.spendingTracker.entity.User;
//import com.example.spendingTracker.repository.UserRepository;
//import com.example.spendingTracker.util.JwtUtil;
//import com.google.api.client.googleapis.auth.oauth2.*;
//import com.google.api.client.json.jackson2.JacksonFactory;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//
//import java.util.Collections;
//
//@Service
//@RequiredArgsConstructor
//public class GoogleAuthService {
//
//    private final UserRepository userRepository;
//    private final JwtUtil jwtUtil;
//
//    private final String CLIENT_ID = "597004127256-sb4a6j2c80h4o45d7ueadfei2g9v2m6o.apps.googleusercontent.com";
//
//    public String googleLogin(String token) {
//
//        try {
//            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
//                    new com.google.api.client.http.javanet.NetHttpTransport(),
//                    JacksonFactory.getDefaultInstance())
//                    .setAudience(Collections.singletonList(CLIENT_ID))
//                    .build();
//
//            GoogleIdToken idToken = verifier.verify(token);
//
//            if (idToken == null) {
//                throw new RuntimeException("Invalid Google token");
//            }
//
//            GoogleIdToken.Payload payload = idToken.getPayload();
//
//            String email = payload.getEmail();
//            String name = (String) payload.get("name");
//
//            // check user
//            User user = userRepository.findByEmail(email).orElse(null);
//
//            if (user == null) {
//                user = new User();
//                user.setEmail(email);
//                user.setName(name);
//                user.setPassword("google_user");
//                userRepository.save(user);
//            }
//
//            return jwtUtil.generateToken(email);
//
//        } catch (Exception e) {
//            throw new RuntimeException("Google login failed");
//        }

//    }
//}


package com.example.spendingTracker.service;

import com.google.api.client.googleapis.auth.oauth2.*;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
//import com.google.api.client.util.Value;
import org.springframework.beans.factory.annotation.Value;  // ✅ CORRECT
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class GoogleAuthService {

   // private static final String CLIENT_ID = "${GOOGLE_CLIENT_SECRET}";

    @Value("${google.client.id}")
    private String clientId;

    public String verifyToken(String token) {

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
                    //new JacksonFactory()
            )
                    .setAudience(Collections.singletonList(clientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(token);

            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();

                String email = payload.getEmail();
                String name = (String) payload.get("name");

                return "Login Success: " + name + " (" + email + ")";
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return "Invalid Token";
    }
}