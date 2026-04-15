//package com.example.spendingTracker.util;
//
//import io.jsonwebtoken.*;
//import io.jsonwebtoken.security.Keys;
//import org.springframework.stereotype.Component;
//
//import javax.crypto.SecretKey;
//import java.security.PublicKey;
//import java.util.Date;
//
//import static io.jsonwebtoken.Jwts.*;
//
////@Component
////public class JwtUtil {
////
////   // private final String SECRET = "mysecretkey";
////   private final String SECRET = "mySuperSecretKeyForJwtThatIsAtLeast32CharsLong";
////
////    public String generateToken(String email) {
////        return builder()
////                .setSubject(email)
////                .setIssuedAt(new Date())
////                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
////
////                .signWith(SignatureAlgorithm.HS256, SECRET)
////                .compact();
////    }
////
////
////public String extractEmail(String token) {
////    return Jwts.parser()
////            .setSigningKey(SECRET)
////            .parseClaimsJws(token)  // <- This verifies signature
////            .getBody()
////            .getSubject();
////}
////
////    public boolean isTokenValid(String token) {
////        try {
////            Jwts.parser().setSigningKey(SECRET).parseClaimsJws(token);
////            return true;
////        } catch (JwtException e) {
////            return false;
////        }
////    }
////
////
////}
//
//
//
//
//@Component
//public class JwtUtil {
//
//    private final String SECRET = "mySuperSecretKeyForJwtThatIsAtLeast32CharsLong";
//
//    private SecretKey getKey() {
//        return Keys.hmacShaKeyFor(SECRET.getBytes());
//    }
//
//    public String generateToken(String email) {
//        return Jwts.builder()
//                .subject(email)
//                .issuedAt(new Date())
//                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
//                .signWith(getKey())   // ✅ FIX
//                .compact();
//    }
//
//    public String extractEmail(String token) {
//        return Jwts.parser()
//                .verifyWith(getKey())   // ✅ FIX
//                .build()
//                .parseSignedClaims(token)
//                .getPayload()
//                .getSubject();
//    }
//
//    public boolean isTokenValid(String token) {
//        try {
//            Jwts.parser().setSigningKey(SECRET);
//            return true;
//        } catch (JwtException e) {
//            return false;
//        }
//
//
//}}

package com.example.spendingTracker.util;

import org.springframework.beans.factory.annotation.Value;  // ✅ CORRECT
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;



@Component
public class JwtUtil {

   // private final String SECRET = "${JWT_SECRET}";
   @Value("${jwt.secret}")
   private String secret;

    private SecretKey getKey() {
        //return Keys.hmacShaKeyFor(SECRET.getBytes());
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // ✅ Generate Token
    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
                .signWith(getKey())
                .compact();
    }

    // ✅ Extract Claims
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // ✅ Extract Email
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    // ✅ VALIDATION (MOST IMPORTANT)
    public boolean validateToken(String token) {
        try {
            extractAllClaims(token); // exception throw karega agar invalid
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}