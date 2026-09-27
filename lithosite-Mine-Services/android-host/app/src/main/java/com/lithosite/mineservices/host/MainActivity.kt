package com.lithosite.mineservices.host

import android.app.Activity
import android.os.Bundle
import android.widget.TextView
import com.chaquo.python.Python

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val status = TextView(this).apply {
            text = "Lithosite Mine Services\nHost runtime initializing..."
            textSize = 18f
            setPadding(32, 64, 32, 32)
        }
        setContentView(status)

        try {
            val py = Python.getInstance()
            val bridge = py.getModule("android_entry")
            val result = bridge.callAttr("healthcheck", filesDir.absolutePath).toString()
            status.text = "Lithosite Mine Services\n$result"
        } catch (error: Exception) {
            status.text = "Lithosite Mine Services\nHOST-005: runtime initialization failed"
        }
    }
}
