////package com.example.spendingTracker.security;
////
////import com.example.spendingTracker.util.JwtUtil;
////import jakarta.servlet.*;
////import jakarta.servlet.http.*;
////import lombok.RequiredArgsConstructor;
////import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
////import org.springframework.security.core.authority.SimpleGrantedAuthority;
////import org.springframework.security.core.context.SecurityContextHolder;
////import org.springframework.stereotype.Component;
////import org.springframework.web.filter.OncePerRequestFilter;
////
////import java.io.IOException;
////import java.util.List;
////
////@Component
////@RequiredArgsConstructor
////public class JwtFilter extends OncePerRequestFilter {
////
////    private final JwtUtil jwtUtil;
////
////
////
////
////
////    @Override
////    protected void doFilterInternal(HttpServletRequest request,
////                                    HttpServletResponse response,
////                                    FilterChain filterChain)
////            throws ServletException, IOException {
////
////        String header = request.getHeader("Authorization");
////
////        if (header != null && header.startsWith("Bearer ")) {
////            String token = header.substring(7);
////            try {
////                if (jwtUtil.isTokenValid(token)) {
////                    String email = jwtUtil.extractEmail(token);
////                    UsernamePasswordAuthenticationToken auth =
////                            new UsernamePasswordAuthenticationToken(email, null, List.of());
////                    SecurityContextHolder.getContext().setAuthentication(auth);
////                }
////            } catch (Exception e) {
////                System.out.println("JwtFilter: Invalid token");
////            }
////        }
////
////        filterChain.doFilter(request, response);
////    }
////}
//
//package com.example.spendingTracker.security;
//
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//
//import org.springframework.stereotype.Component;
//import org.springframework.web.filter.OncePerRequestFilter;
//
//import java.io.IOException;
////
////@Component
////public class JwtFilter extends OncePerRequestFilter {
////
////    @Override
////    protected void doFilterInternal(HttpServletRequest request,
////                                    HttpServletResponse response,
////                                    FilterChain filterChain)
////            throws ServletException, IOException {
////
////        String header = request.getHeader("Authorization");
////
////        if (header != null && header.startsWith("Bearer ")) {
////            String token = header.substring(7);
////
////            // TODO: token validate karo (JWT util se)
////            System.out.println("Token: " + token);
////        }
////
////        filterChain.doFilter(request, response);
////    }
////}
//package com.example.spendingTracker.security;
//
//import com.example.spendingTracker.util.JwtUtil;
//import io.jsonwebtoken.Claims;
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.security.core.authority.SimpleGrantedAuthority;
//import org.springframework.stereotype.Component;
//import org.springframework.web.filter.OncePerRequestFilter;
//
//import java.io.IOException;
//import java.util.Collections;
//
//@Component
//@RequiredArgsConstructor
//public class JwtFilter extends OncePerRequestFilter {
//
//    private final JwtUtil jwtUtil;
//
//    @Override
//    protected void doFilterInternal(HttpServletRequest request,
//                                    HttpServletResponse response,
//                                    FilterChain filterChain)
//            throws ServletException, IOException {
//
//        String header = request.getHeader("Authorization");
//
//        // 🔐 Check Bearer token
//        if (header != null && header.startsWith("Bearer ")) {
//
//            String token = header.substring(7);
//
//            try {
//                // ✅ Validate token
//                if (jwtUtil.validateToken(token)) {
//
//                    // ✅ Extract claims
//                    Claims claims = jwtUtil.extractAllClaims(token);
//                    String username = claims.getSubject();
//
//                    // 🔥 Create authentication
//                    UsernamePasswordAuthenticationToken auth =
//                            new UsernamePasswordAuthenticationToken(
//                                    username,
//                                    null,
//                                    Collections.singletonList(
//                                            new SimpleGrantedAuthority("ROLE_USER")
//                                    )
//                            );
//
//                    // ✅ Set in Security Context
//                    SecurityContextHolder.getContext().setAuthentication(auth);
//                }
//
//            } catch (Exception e) {
//                System.out.println("JWT Error: " + e.getMessage());
//            }
//        }
//
//        filterChain.doFilter(request, response);
//    }
//}
//

package com.example.spendingTracker.security;

import com.example.spendingTracker.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // ✅ IMPORTANT: Skip filter for public routes
        if (path.startsWith("/api/auth") ||
                path.startsWith("/error") ||
                path.equals("/") ||
                path.endsWith(".html") ||
                path.endsWith(".css") ||
                path.endsWith(".js") ||
                path.endsWith(".png") ||
                path.endsWith(".jpg")) {

            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {

            String token = authHeader.substring(7);

            if (jwtUtil.validateToken(token)) {

                Claims claims = jwtUtil.extractAllClaims(token);
                String email = claims.getSubject();

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                Collections.singletonList(
                                        new SimpleGrantedAuthority("ROLE_USER")
                                )
                        );

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }

}